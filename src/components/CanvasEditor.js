import React, { useCallback, useMemo, useRef, useState } from "react";
import { CARD_WIDTH, CARD_HEIGHT, toNum } from "../utils/cardDimensions";
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Animated,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";


// Use the same padding as MobileCard.js and preview
const CARD_PADDING = 8;

function toNum(v, fallback) {
  if (typeof v === "number" && isFinite(v)) return v;
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
const BASE =
  (typeof NEXT_EXTRA === "string"
    ? NEXT_EXTRA
    : NEXT_EXTRA?.production || NEXT_EXTRA?.development) ||
  "http://localhost:3000";
function toAbs(u) {
  if (!u) return null;
  if (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:")
  )
    return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${BASE}${path}`;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toResizeMode = (fit) => {
  switch ((fit || "contain").toLowerCase()) {
    case "cover":
      return "cover";
    case "fill":
      return "stretch";
    case "contain":
    default:
      return "contain";
  }
};
const mapFontFamily = (f) => {
  if (!f) return undefined;
  const s = String(f).toLowerCase();
  if (s.includes("mono")) return "monospace";
  if (s.includes("serif") && !s.includes("sans")) return "serif";
  return "sans-serif";
};

export default function CanvasEditor({
  side = "recto",
  layout,
  onChange,
  selectedIdx,
  onSelectIdx,
  onInteractStart,
  onInteractEnd,
  // options
  snapStep = 0.5, // percent units; set <= 0 to disable
  snapEnabled = true,
  lockCircleAspect = true, // keep circle images perfectly square while resizing
  // drag-specific snap controls (off by default for fluidity)
  snapDragDuringMove = false,
  snapDragOnRelease = false,
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The inner area (excluding padding)
  const [inner, setInner] = useState({ w: 0, h: 0 });
  // Local revision state to trigger light rerenders during drag only
  const [rev, setRev] = useState(0);
  // Drag tuning
  const MOVE_TRIGGER_THRESHOLD_PX = 2; // start drag after ~2px movement
  const DRAG_THROTTLE_MS = 16; // ~60fps throttle
  const DRAG_MIN_UPDATE_DELTA_PX = 1.5; // ignore micro-moves under ~1.5px

  // Use the same base as MobileCard.js (aspect 7:4, with padding)
  const scale = useMemo(() => ({
    w: inner.w ? inner.w / CARD_WIDTH : 1,
    h: inner.h ? inner.h / CARD_HEIGHT : 1,
  }), [inner]);

  const elements = Array.isArray(layout?.elements) ? layout.elements : [];

  const updateElement = useCallback(
    (idx, patch) => {
      const next = elements.map((el, i) =>
        i === idx ? { ...el, ...patch } : el
      );
      onChange({ ...layout, elements: next });
    },
    [elements, layout, onChange]
  );

  const panRefs = useRef({}); // move handle responders per element
  const resizeRafs = useRef({});
  const moveRafs = useRef({});
  const lastMoveTs = useRef({});
  const SNAP = snapEnabled && snapStep > 0 ? snapStep : 0; // percent units
  const SNAP_DRAG = snapDragDuringMove && SNAP > 0 ? SNAP : 0; // drag move snapping


  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) {
      setSize({ w: width, h: height });
      setInner({ w: width - 2 * CARD_PADDING, h: height - 2 * CARD_PADDING });
    }
  };

  const renderElement = (el, idx) => {
    const xPctBase = toNum(el?.position?.x, 0);
    const yPctBase = toNum(el?.position?.y, 0);
    let wPct = toNum(el?.style?.width, 20);
    let hPct = toNum(el?.style?.height, 10);
    // Effective position: use visual drag pos if active
    const vis = panRefs.current[idx]?.vis;
    let xPct =
      panRefs.current[idx]?.dragging && vis && typeof vis.x === "number"
        ? vis.x
        : xPctBase;
    let yPct =
      panRefs.current[idx]?.dragging && vis && typeof vis.y === "number"
        ? vis.y
        : yPctBase;
    // If a resize is active for this element, overlay visual rect
    const visResize = Object.values(handleRefs.current || {}).find(
      (h) => h?.vis && h?.start && h?.start.x !== undefined
    );
    if (visResize && visResize.vis) {
      // Narrow to current index: search keys matching `${idx}:`
      const anyKey = Object.keys(handleRefs.current || {}).find(
        (k) => k.startsWith(`${idx}:`) && handleRefs.current[k]?.vis
      );
      if (anyKey) {
        const v = handleRefs.current[anyKey].vis;
        if (typeof v.x === "number") xPct = v.x;
        if (typeof v.y === "number") yPct = v.y;
        if (typeof v.w === "number") wPct = v.w;
        if (typeof v.h === "number") hPct = v.h;
      }
    }
  // All calculations are now based on the inner padded area
  const left = CARD_PADDING + (xPct / 100) * inner.w;
  const top = CARD_PADDING + (yPct / 100) * inner.h;
  const width = (wPct / 100) * inner.w;
  const height = (hPct / 100) * inner.h;
    // keep latest rect for gesture decision
    if (!panRefs.current[idx]) panRefs.current[idx] = {};
    panRefs.current[idx].rect = { left, top, width, height };
    const isSelected = idx === selectedIdx;

    // ensure a move responder exists for this element
    if (!panRefs.current[idx])
      panRefs.current[idx] = {
        start: { x: xPctBase, y: yPctBase },
        pan: null,
        dragging: false,
        vis: null,
      };
    if (!panRefs.current[idx].anim) {
      panRefs.current[idx].anim = new Animated.ValueXY({ x: 0, y: 0 });
    }
    if (!panRefs.current[idx].pan) {
      // Prepare a native-driver animated move handler and wrap it as a function
      panRefs.current[idx].animatedMove = Animated.event(
        [
          null,
          { dx: panRefs.current[idx].anim.x, dy: panRefs.current[idx].anim.y },
        ],
        { useNativeDriver: false }
      );
      panRefs.current[idx].pan = PanResponder.create({
        // Start drag unless finger is on a resize handle
        onStartShouldSetPanResponder: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const r = panRefs.current[idx]?.rect || { width: 0, height: 0 };
          const t = 24; // handle hit size in px
          const onCorner =
            (locationX <= t && locationY <= t) || // nw
            (locationX >= r.width - t && locationY <= t) || // ne
            (locationX <= t && locationY >= r.height - t) || // sw
            (locationX >= r.width - t && locationY >= r.height - t); // se
          return !onCorner;
        },
        onMoveShouldSetPanResponder: (evt, gesture) =>
          Math.abs(gesture.dx) > MOVE_TRIGGER_THRESHOLD_PX ||
          Math.abs(gesture.dy) > MOVE_TRIGGER_THRESHOLD_PX,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          panRefs.current[idx].start = {
            x: toNum(el?.position?.x, 0),
            y: toNum(el?.position?.y, 0),
          };
          panRefs.current[idx].startPx = panRefs.current[idx].rect; // { left, top, width, height }
          // We're now in a drag gesture (granted after move threshold)
          panRefs.current[idx].dragging = true;
          // reset throttle deltas
          panRefs.current[idx].lastDx = 0;
          panRefs.current[idx].lastDy = 0;
          // reset animated offset
          panRefs.current[idx].anim.setValue({ x: 0, y: 0 });
          // precompute bounds for clamped transform
          const stPx = panRefs.current[idx].startPx || {
            left: left || 0,
            top: top || 0,
            width: width || 0,
            height: height || 0,
          };
          panRefs.current[idx].bounds = {
            minDx: -stPx.left,
            maxDx: (inner.w || 0) - (stPx.left + stPx.width),
            minDy: -stPx.top,
            maxDy: (inner.h || 0) - (stPx.top + stPx.height),
          };
          // Select the element immediately so drag begins in one gesture
          onSelectIdx && onSelectIdx(idx);
          onInteractStart && onInteractStart("drag");
        },
        onPanResponderMove: (evt, gesture) => {
          // Lightweight time + delta throttle to reduce jitter
          const key = `drag:${idx}`;
          const now = Date.now();
          const lastT = lastMoveTs.current[key] || 0;
          const lastDx = panRefs.current[idx]?.lastDx ?? 0;
          const lastDy = panRefs.current[idx]?.lastDy ?? 0;
          const dDx = Math.abs(gesture.dx - lastDx);
          const dDy = Math.abs(gesture.dy - lastDy);
          if (now - lastT < DRAG_THROTTLE_MS) return;
          if (dDx < DRAG_MIN_UPDATE_DELTA_PX && dDy < DRAG_MIN_UPDATE_DELTA_PX)
            return;
          lastMoveTs.current[key] = now;
          // Clamp to bounds before applying
          const b = panRefs.current[idx]?.bounds || {
            minDx: -9999,
            maxDx: 9999,
            minDy: -9999,
            maxDy: 9999,
          };
          const dx = clamp(gesture.dx, b.minDx, b.maxDx);
          const dy = clamp(gesture.dy, b.minDy, b.maxDy);
          panRefs.current[idx].lastDx = dx;
          panRefs.current[idx].lastDy = dy;
          // Update animated value (JS driver)
          panRefs.current[idx].anim.setValue({ x: dx, y: dy });
        },
        onPanResponderRelease: (evt, gesture) => {
          if (moveRafs.current[idx]) {
            cancelAnimationFrame(moveRafs.current[idx]);
            moveRafs.current[idx] = null;
          }
          // If there was no movement, treat as a tap to select
          if (!panRefs.current[idx].dragging) {
            onSelectIdx(idx);
          }
          // Commit final position once on release
          const b = panRefs.current[idx].bounds || {
            minDx: -Infinity,
            maxDx: Infinity,
            minDy: -Infinity,
            maxDy: Infinity,
          };
          // Use last clamped deltas if available for consistency with visual state
          const ldx = panRefs.current[idx]?.lastDx;
          const ldy = panRefs.current[idx]?.lastDy;
          let dx =
            typeof ldx === "number" ? ldx : clamp(gesture.dx, b.minDx, b.maxDx);
          let dy =
            typeof ldy === "number" ? ldy : clamp(gesture.dy, b.minDy, b.maxDy);
          const sx = panRefs.current[idx].start.x;
          const sy = panRefs.current[idx].start.y;
          let nx = clamp(sx + (dx / (inner.w || 1)) * 100, 0, 100 - wPct);
          let ny = clamp(sy + (dy / (inner.h || 1)) * 100, 0, 100 - hPct);
          if (snapDragOnRelease && SNAP > 0) {
            nx = Math.round(nx / SNAP) * SNAP;
            ny = Math.round(ny / SNAP) * SNAP;
            nx = clamp(nx, 0, 100 - wPct);
            ny = clamp(ny, 0, 100 - hPct);
          }
          updateElement(idx, {
            position: { ...(el.position || {}), x: nx, y: ny },
          });
          // reset animated offset
          panRefs.current[idx].anim.setValue({ x: 0, y: 0 });
          panRefs.current[idx].vis = null;
          panRefs.current[idx].dragging = false;
          panRefs.current[idx].lastDx = 0;
          panRefs.current[idx].lastDy = 0;
          onInteractEnd && onInteractEnd("drag");
        },
        onPanResponderTerminate: () => {
          if (moveRafs.current[idx]) {
            cancelAnimationFrame(moveRafs.current[idx]);
            moveRafs.current[idx] = null;
          }
          // Commit on terminate as well to avoid snapping back
          const b = panRefs.current[idx].bounds || {
            minDx: -Infinity,
            maxDx: Infinity,
            minDy: -Infinity,
            maxDy: Infinity,
          };
          const dx = clamp(panRefs.current[idx]?.lastDx ?? 0, b.minDx, b.maxDx);
          const dy = clamp(panRefs.current[idx]?.lastDy ?? 0, b.minDy, b.maxDy);
          const sx = panRefs.current[idx].start.x;
          const sy = panRefs.current[idx].start.y;
          let nx = clamp(sx + (dx / (inner.w || 1)) * 100, 0, 100 - wPct);
          let ny = clamp(sy + (dy / (inner.h || 1)) * 100, 0, 100 - hPct);
          if (snapDragOnRelease && SNAP > 0) {
            nx = Math.round(nx / SNAP) * SNAP;
            ny = Math.round(ny / SNAP) * SNAP;
            nx = clamp(nx, 0, 100 - wPct);
            ny = clamp(ny, 0, 100 - hPct);
          }
          updateElement(idx, {
            position: { ...(el.position || {}), x: nx, y: ny },
          });
          panRefs.current[idx].anim.setValue({ x: 0, y: 0 });
          panRefs.current[idx].vis = null;
          panRefs.current[idx].dragging = false;
          panRefs.current[idx].lastDx = 0;
          panRefs.current[idx].lastDy = 0;
          onInteractEnd && onInteractEnd("drag");
        },
      });
    }

    const borderStyle = isSelected
      ? { borderColor: "#2563eb", borderWidth: 2 }
      : {};

    if (el.type === "text") {
      const color = el?.style?.color || "#111827";
      const providedFontSize = el?.style?.fontSize;
      const fontSize =
        providedFontSize != null
          ? toNum(providedFontSize, 16)
          : Math.max(8, 16 * scale.w);
      const fontWeight = el?.style?.fontWeight || "400";
      const fontStyle = el?.style?.fontStyle || "normal";
      const textAlign = el?.style?.textAlign || "left";
      const letterSpacing =
        el?.style?.letterSpacing != null
          ? toNum(el.style.letterSpacing, undefined)
          : undefined;
      const lineHeight =
        el?.style?.lineHeight != null
          ? toNum(el.style.lineHeight, undefined)
          : undefined;
      const fontFamily = mapFontFamily(el?.style?.fontFamily);
      const alignItems =
        textAlign === "left"
          ? "flex-start"
          : textAlign === "right"
          ? "flex-end"
          : "center";
      const padding = toNum(el?.style?.padding, 0) * scale.w;
      const borderWidth = toNum(el?.style?.borderWidth, 0) * scale.w;
      const borderColor = el?.style?.borderColor || "transparent";
      const backgroundColor = el?.style?.backgroundColor || "transparent";
      const borderRadius = toNum(el?.style?.borderRadius, 0);
      const tx = panRefs.current[idx].anim.x;
      const ty = panRefs.current[idx].anim.y;
      return (
        <Animated.View
          key={idx}
          style={[
            styles.abs,
            { left, top, width, height },
            borderStyle,
            { transform: [{ translateX: tx }, { translateY: ty }] },
          ]}
          onTouchEnd={() => {
            if (!panRefs.current[idx]?.dragging && !handleActive.current)
              onSelectIdx(idx);
          }}
          {...(panRefs.current[idx].pan?.panHandlers || {})}
        >
          <View
            style={[
              styles.fill,
              {
                justifyContent: "center",
                alignItems,
                padding,
                borderWidth,
                borderColor,
                backgroundColor,
                borderRadius,
                overflow: "hidden",
              },
            ]}
          >
            <Text
              style={{
                color,
                fontSize,
                fontWeight,
                fontStyle,
                textAlign,
                letterSpacing,
                lineHeight,
                fontFamily,
                includeFontPadding: false,
              }}
              numberOfLines={0}
            >
              {String(el.content || "Texte")}
            </Text>
          </View>

          {isSelected ? (
            <View
              style={[styles.moveHandle, { left: "50%", marginLeft: -10 }]}
              {...(panRefs.current[idx].pan?.panHandlers || {})}
            />
          ) : null}
          {isSelected
            ? renderResizeHandles(
                idx,
                { left, top, width, height },
                { xPct, yPct, wPct, hPct },
                el
              )
            : null}
        </Animated.View>
      );
    }
    if (el.type === "image" || el.type === "socialIcon") {
      const uri = toAbs(String(el.content || ""));
      const svg =
        uri && (uri.endsWith(".svg") || uri.startsWith("data:image/svg"));
      const resizeMode = toResizeMode(el?.style?.objectFit || "contain");
      // Border radius and circle shape handling
      const brPct = toNum(el?.style?.borderRadius, 0);
      const minSide = Math.min(width || 0, height || 0) || 0;
      const clipRadius =
        el?.style?.shape === "circle"
          ? minSide / 2
          : brPct
          ? (brPct / 100) * minSide
          : 0;
      const tx = panRefs.current[idx].anim.x;
      const ty = panRefs.current[idx].anim.y;
      return (
        <Animated.View
          key={idx}
          style={[
            styles.abs,
            { left, top, width, height },
            borderStyle,
            { transform: [{ translateX: tx }, { translateY: ty }] },
          ]}
          onTouchEnd={() => {
            if (!panRefs.current[idx]?.dragging && !handleActive.current)
              onSelectIdx(idx);
          }}
          {...(panRefs.current[idx].pan?.panHandlers || {})}
        >
          <View
            style={[
              styles.fill,
              { overflow: "hidden", borderRadius: clipRadius },
            ]}
          >
            {svg ? (
              <SvgUri uri={uri} width="100%" height="100%" />
            ) : (
              <Image
                source={{ uri }}
                style={styles.fill}
                resizeMode={resizeMode}
              />
            )}
          </View>

          {isSelected ? (
            <View
              style={[styles.moveHandle, { left: "50%", marginLeft: -10 }]}
              {...(panRefs.current[idx].pan?.panHandlers || {})}
            />
          ) : null}
          {isSelected
            ? renderResizeHandles(
                idx,
                { left, top, width, height },
                { xPct, yPct, wPct, hPct },
                el
              )
            : null}
        </Animated.View>
      );
    }
    if (el.type === "audio") {
      const tx = panRefs.current[idx].anim.x;
      const ty = panRefs.current[idx].anim.y;
      return (
        <Animated.View
          key={idx}
          style={[
            styles.abs,
            { left, top, width, height },
            borderStyle,
            { justifyContent: "center", alignItems: "center" },
            { transform: [{ translateX: tx }, { translateY: ty }] },
          ]}
          onTouchEnd={() => {
            if (!panRefs.current[idx]?.dragging && !handleActive.current)
              onSelectIdx(idx);
          }}
          {...(panRefs.current[idx].pan?.panHandlers || {})}
        >
          <Text style={{ fontSize: 22 }}>🔊</Text>

          {isSelected
            ? renderResizeHandles(
                idx,
                { left, top, width, height },
                { xPct, yPct, wPct, hPct },
                el
              )
            : null}
        </Animated.View>
      );
    }
    return null;
  };

  const renderResizeHandles = (idx, rect, pct, el) => {
    const sizePx = 20;
    const half = sizePx / 2;
    const common = {
      position: "absolute",
      width: sizePx,
      height: sizePx,
      backgroundColor: "#2563eb",
      borderRadius: sizePx / 2,
      borderWidth: 2,
      borderColor: "#fff",
    };
    const hit = { top: 12, bottom: 12, left: 12, right: 12 };
    // Handle types: n, s, e, w, ne, nw, se, sw
    return (
      <>
        {/* Corners only for size control */}
        <View
          style={[common, { left: -half, top: -half }]}
          hitSlop={hit}
          {...getHandlePan(idx, pct, "nw", el).panHandlers}
        />
        <View
          style={[common, { right: -half, top: -half }]}
          hitSlop={hit}
          {...getHandlePan(idx, pct, "ne", el).panHandlers}
        />
        <View
          style={[common, { left: -half, bottom: -half }]}
          hitSlop={hit}
          {...getHandlePan(idx, pct, "sw", el).panHandlers}
        />
        <View
          style={[common, { right: -half, bottom: -half }]}
          hitSlop={hit}
          {...getHandlePan(idx, pct, "se", el).panHandlers}
        />
      </>
    );
  };

  const handleRefs = useRef({});
  const handleActive = useRef(false);
  const getHandlePan = (idx, pct, type, elForHandle) => {
    const elType = elForHandle?.type || "other";
    const key = `${idx}:${elType}:${type}`;
    if (!handleRefs.current[key])
      handleRefs.current[key] = {
        pan: null,
        start: { x: pct.xPct, y: pct.yPct, w: pct.wPct, h: pct.hPct },
        vis: null,
      };
    if (handleRefs.current[key].pan) return handleRefs.current[key].pan;

    const isImage = elType === "image" || elType === "socialIcon";
    const moveImpl = (st, dxPct, dyPct) => {
      let nx = st.x;
      let ny = st.y;
      let nw = st.w;
      let nh = st.h;
      if (type.includes("e")) nw = st.w + dxPct;
      if (type.includes("s")) nh = st.h + dyPct;
      if (type.includes("w")) {
        nw = st.w - dxPct;
        nx = st.x + dxPct;
      }
      if (type.includes("n")) {
        nh = st.h - dyPct;
        ny = st.y + dyPct;
      }

      // Image: optional circle aspect lock
      if (
        isImage &&
        lockCircleAspect &&
        elForHandle?.style?.shape === "circle"
      ) {
        const anchor = {
          se: { ax: st.x, ay: st.y },
          ne: { ax: st.x, ay: st.y + st.h },
          sw: { ax: st.x + st.w, ay: st.y },
          nw: { ax: st.x + st.w, ay: st.y + st.h },
        }[type] || { ax: st.x, ay: st.y };
        const size = Math.max(nw, nh);
        nw = size;
        nh = size;
        if (type === "se") {
          nx = anchor.ax;
          ny = anchor.ay;
        }
        if (type === "ne") {
          nx = anchor.ax;
          ny = anchor.ay - nh;
        }
        if (type === "sw") {
          nx = anchor.ax - nw;
          ny = anchor.ay;
        }
        if (type === "nw") {
          nx = anchor.ax - nw;
          ny = anchor.ay - nh;
        }
      }
      // Clamp
      nw = clamp(nw, 1, 100 - nx);
      nh = clamp(nh, 1, 100 - ny);
      nx = clamp(nx, 0, 100 - nw);
      ny = clamp(ny, 0, 100 - nh);
      return { nx, ny, nw, nh };
    };

    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        handleActive.current = true;
        const el = elements[idx] || {};
        handleRefs.current[key].start = {
          x: toNum(el?.position?.x, pct.xPct),
          y: toNum(el?.position?.y, pct.yPct),
          w: toNum(el?.style?.width, pct.wPct),
          h: toNum(el?.style?.height, pct.hPct),
        };
        onSelectIdx(idx);
        onInteractStart && onInteractStart("resize");
      },
      onPanResponderMove: (evt, gesture) => {
        const now = Date.now();
        const last = lastMoveTs.current[key] || 0;
        if (now - last < 16) return;
        lastMoveTs.current[key] = now;
        if (resizeRafs.current[key]) return;
        resizeRafs.current[key] = requestAnimationFrame(() => {
          resizeRafs.current[key] = null;
          const dxPct = (gesture.dx / (inner.w || 1)) * 100;
          const dyPct = (gesture.dy / (inner.h || 1)) * 100;
          const st = handleRefs.current[key].start;
          let { nx, ny, nw, nh } = moveImpl(st, dxPct, dyPct);
          // Text: snap during move for higher precision
          if (!isImage && SNAP > 0) {
            nx = Math.round(nx / SNAP) * SNAP;
            ny = Math.round(ny / SNAP) * SNAP;
            nw = Math.round(nw / SNAP) * SNAP;
            nh = Math.round(nh / SNAP) * SNAP;
            // Re-clamp after snapping
            nw = clamp(nw, 1, 100 - nx);
            nh = clamp(nh, 1, 100 - ny);
            nx = clamp(nx, 0, 100 - nw);
            ny = clamp(ny, 0, 100 - nh);
          }
          handleRefs.current[key].vis = { x: nx, y: ny, w: nw, h: nh };
          setRev((r) => (r + 1) % 1_000_000);
        });
      },
      onPanResponderRelease: () => {
        if (resizeRafs.current[key]) {
          cancelAnimationFrame(resizeRafs.current[key]);
          resizeRafs.current[key] = null;
        }
        const vis = handleRefs.current[key].vis;
        if (vis) {
          const arr = elements.slice();
          const cur = arr[idx] || {};
          let sx = vis.x,
            sy = vis.y,
            sw = vis.w,
            sh = vis.h;
          if (SNAP > 0) {
            // Text: snap pos and size; Image: pos only
            sx = Math.round(sx / SNAP) * SNAP;
            sy = Math.round(sy / SNAP) * SNAP;
            if (!isImage) {
              sw = Math.round(sw / SNAP) * SNAP;
              sh = Math.round(sh / SNAP) * SNAP;
            }
          }
          // Clamp
          sw = clamp(sw, 1, 100 - sx);
          sh = clamp(sh, 1, 100 - sy);
          sx = clamp(sx, 0, 100 - sw);
          sy = clamp(sy, 0, 100 - sh);
          const nextStyle = { ...(cur.style || {}), width: sw, height: sh };
          if (cur.type === "text") {
            const baseFs = toNum(cur?.style?.fontSize, 16);
            const scaleBy = (sh || 1) / (handleRefs.current[key].start.h || 1);
            nextStyle.fontSize = Math.max(8, baseFs * scaleBy);
          }
          arr[idx] = {
            ...cur,
            position: { ...(cur.position || {}), x: sx, y: sy },
            style: nextStyle,
          };
          onChange({ ...layout, elements: arr });
        }
        handleRefs.current[key].vis = null;
        handleActive.current = false;
        onInteractEnd && onInteractEnd("resize");
      },
      onPanResponderTerminate: () => {
        if (resizeRafs.current[key]) {
          cancelAnimationFrame(resizeRafs.current[key]);
          resizeRafs.current[key] = null;
        }
        handleRefs.current[key].vis = null;
        handleActive.current = false;
        onInteractEnd && onInteractEnd("resize");
      },
    });
    handleRefs.current[key].pan = pan;
    return pan;
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.canvas}>
        <Background background={layout?.background} />
        <View style={{ position: "absolute", left: CARD_PADDING, top: CARD_PADDING, width: inner.w, height: inner.h }} pointerEvents="box-none">
          {elements.map((el, idx) => renderElement(el, idx))}
        </View>
      </View>
    </View>
  );
}

function Background({ background }) {
  if (!background)
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f3f4f6" }]} />
    );
  const { type, value } = background;
  if (type === "color" && value) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: value }]} />
    );
  }
  if (type === "gradient" && value) {
    const colors = value.match(/#[0-9a-fA-F]{3,8}/g) || ["#e5e7eb", "#d1d5db"];
    return (
      <LinearGradient
        colors={colors.slice(0, 2)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  if (type === "image" && value) {
    const uri = toAbs(String(value));
    const isSvg =
      uri && (uri.endsWith(".svg") || uri.startsWith("data:image/svg"));
    if (isSvg) return <SvgUri uri={uri} width="100%" height="100%" />;
    return (
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f3f4f6" }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 7 / 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: CARD_PADDING,
  },
  canvas: { flex: 1 },
  abs: { position: "absolute" },
  fill: { width: "100%", height: "100%" },
  moveHandle: {
    position: "absolute",
    top: -12,
    width: 20,
    height: 20,
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
