import React, { useState, memo, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SvgUri, SvgXml } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { colors } from "../theme/theme";
import { calculateFontSize, toNum } from "../utils/cardDimensions";
// Resolve base URL from Expo extra; supports string or {development,production}
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

// Simple in-memory cache for fetched SVG xml
const svgCache = new Map();
export async function prefetchSvgUri(u) {
  try {
    const uri = toAbs(u);
    if (!uri || svgCache.has(uri)) return;
    const res = await fetch(uri);
    if (!res.ok) return;
    const xml = await res.text();
    if (xml) svgCache.set(uri, xml);
  } catch {}
}

function Background({ background }) {
  const [xml, setXml] = useState(null);
  const type = background?.type;
  const value = background?.value;
  const uri = type === "image" && value ? toAbs(value) : null;
  const isSvg = !!(
    uri &&
    (uri.endsWith(".svg") || uri.startsWith("data:image/svg"))
  );

  useEffect(() => {
    let cancelled = false;
    if (isSvg && uri) {
      const cached = svgCache.get(uri) || null;
      if (cached) {
        setXml(cached);
      } else {
        (async () => {
          try {
            const res = await fetch(uri);
            const txt = await res.text();
            if (!cancelled && txt) {
              svgCache.set(uri, txt);
              setXml(txt);
            }
          } catch {}
        })();
      }
    } else {
      setXml(null);
    }
    return () => {
      cancelled = true;
    };
  }, [uri, isSvg]);

  if (!background)
    return <View style={[styles.cardFace, { backgroundColor: "#eee" }]} />;
  if (type === "image" && value) {
    if (!uri)
      return <View style={[styles.cardFace, { backgroundColor: "#eee" }]} />;
    if (isSvg) {
      return xml ? (
        <SvgXml
          xml={xml}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <View style={[styles.cardFace, { backgroundColor: "#eaeaea" }]} />
      );
    }
    return (
      <Image source={{ uri }} style={styles.cardFace} resizeMode="cover" />
    );
  }
  if (type === "color" && value) {
    return <View style={[styles.cardFace, { backgroundColor: value }]} />;
  }
  if (type === "gradient" && value) {
    // Parse simple CSS-like linear-gradient(...)
    const match = String(value).match(
      /linear-gradient\(([^,]+),\s*([^%]+)%?,\s*([^%]+)%?\)/i
    );
    // Fallback to default gradient if parse fails
    const colors = value.includes("#")
      ? value.match(/#[0-9a-fA-F]{3,8}/g)
      : null;
    if (colors && colors.length >= 2) {
      return (
        <LinearGradient
          colors={colors.slice(0, 2)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardFace}
        />
      );
    }
    return <View style={[styles.cardFace, { backgroundColor: "#e9e9e9" }]} />;
  }
  return <View style={[styles.cardFace, { backgroundColor: "#f2f2f2" }]} />;
}

function QRBadge({ uri }) {
  if (!uri) return null;
  return (
    <View style={styles.qrWrap}>
      <Image source={{ uri }} style={styles.qr} />
    </View>
  );
}

function MobileCard({
  card,
  onPress,
  side,
  editable = false,
  onElementPress,
  selectedElementIndex = -1,
}) {
  const [flipped, setFlipped] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const isFlipped = useSharedValue(0);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setSize({ w: width, h: height });
  }, []);

  const baseW = card?.layout?.width || 1050;
  const baseH = card?.layout?.height || 600;

  // helpers
  const scaleW = size.w ? size.w / baseW : 1;
  const scaleH = size.h ? size.h / baseH : 1;
  // Utiliser les fonctions utilitaires partagées pour la cohérence
  const mapFontFamily = (f) => {
    if (!f) return undefined;
    const s = String(f).toLowerCase();
    if (s.includes("mono")) return "monospace";
    if (s.includes("serif") && !s.includes("sans")) return "serif";
    return "sans-serif";
  };
  const sanitizeFontWeight = (w) => {
    if (!w) return "normal";
    const s = String(w).toLowerCase();
    const allowed = new Set([
      "normal",
      "bold",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ]);
    return allowed.has(s) ? s : "normal";
  };
  const sanitizeFontStyle = (v) => {
    if (!v) return "normal";
    const s = String(v).toLowerCase();
    return s === "italic" ? "italic" : "normal";
  };
  const sanitizeTextAlign = (v) => {
    const s = String(v || "left").toLowerCase();
    return ["left", "right", "center", "justify"].includes(s) ? s : "left";
  };
  const sanitizeTextDecoration = (v) => {
    const s = String(v || "none").toLowerCase();
    return [
      "none",
      "underline",
      "line-through",
      "underline line-through",
    ].includes(s)
      ? s
      : "none";
  };
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
  const computeTransforms = (width, height, rotationDeg) => {
    const w = width || 0;
    const h = height || 0;
    // Simulate CSS transform-origin: top left like web
    const preX = w / 2;
    const preY = h / 2;
    return [
      { translateX: preX },
      { translateY: preY },
      { rotate: `${rotationDeg}deg` },
      { translateX: -preX },
      { translateY: -preY },
    ];
  };

  const shadowApprox = (boxShadow) => {
    // Basic approximation for RN (iOS + Android)
    if (!boxShadow) return {};
    return {
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    };
  };

  const renderElements = (elements = []) => {
    if (!Array.isArray(elements) || !size.w || !size.h) return null;
    return elements
      .filter((el) => el?.enabled !== false)
      .map((el, idx) => {
        const xPct = toNum(el?.position?.x, 0);
        const yPct = toNum(el?.position?.y, 0);
        const wPct = toNum(el?.style?.width, 0);
        const hPct = toNum(el?.style?.height, 0);
        const left = isFinite(xPct) ? (xPct / 100) * size.w : 0;
        const top = isFinite(yPct) ? (yPct / 100) * size.h : 0;
        const width =
          isFinite(wPct) && wPct > 0 ? (wPct / 100) * size.w : undefined;
        const height =
          isFinite(hPct) && hPct > 0 ? (hPct / 100) * size.h : undefined;
        const rotation = toNum(el?.style?.rotation, 0);
        const zIndex = toNum(el?.position?.zIndex, 1);

        const isSelected = editable && selectedElementIndex === idx;

        const containerStyle = {
          position: "absolute",
          left,
          top,
          width,
          height,
          transform: computeTransforms(width, height, rotation),
          zIndex,
          backgroundColor: el?.style?.backgroundColor || "transparent",
          padding: toNum(el?.style?.padding, 0) * scaleW,
          borderWidth: isSelected
            ? 2
            : toNum(el?.style?.borderWidth, 0) * scaleW,
          borderColor: isSelected
            ? "#0088ff"
            : el?.style?.borderColor || "transparent",
          borderStyle: isSelected ? "dashed" : "solid",
          opacity:
            el?.style?.opacity === undefined ? 1 : toNum(el.style.opacity, 1),
          overflow: "hidden",
          borderRadius: 0,
          ...shadowApprox(el?.style?.boxShadow),
        };

        // Border radius handling
        if (el?.type === "text") {
          // text: treat borderRadius as px like web
          const br = toNum(el?.style?.borderRadius, 0);
          containerStyle.borderRadius = br ? br * scaleW : 0;
        } else if (el?.type === "image" || el?.type === "socialIcon") {
          const br = toNum(el?.style?.borderRadius, 0);
          const minSide = Math.min(width || 0, height || 0) || 0;
          if (el?.style?.shape === "circle") {
            containerStyle.borderRadius = minSide / 2;
          } else if (!Number.isNaN(br) && minSide) {
            // interpret as percent like web image style
            containerStyle.borderRadius = (br / 100) * minSide;
          }
        }

        if (el?.type === "text") {
          const color = el?.style?.color || "#000";
          const fontWeight = sanitizeFontWeight(el?.style?.fontWeight);
          const fontStyle = sanitizeFontStyle(el?.style?.fontStyle);
          const textDecorationLine = sanitizeTextDecoration(
            el?.style?.textDecoration
          );
          const textAlign = sanitizeTextAlign(el?.style?.textAlign);
          // Utiliser la fonction de calcul cohérente pour la fontSize
          const fontSize = calculateFontSize(
            width,
            height,
            el?.style?.fontSize
          );
          const letterSpacing =
            el?.style?.letterSpacing != null
              ? toNum(el.style.letterSpacing, undefined)
              : undefined;
          const lineHeight =
            el?.style?.lineHeight != null
              ? toNum(el.style.lineHeight, undefined)
              : undefined;
          const fontFamily = mapFontFamily(el?.style?.fontFamily);

          const ElementContainer = editable ? Pressable : View;

          return (
            <ElementContainer
              key={idx}
              style={[
                containerStyle,
                {
                  justifyContent: "center",
                  alignItems:
                    textAlign === "left"
                      ? "flex-start"
                      : textAlign === "right"
                      ? "flex-end"
                      : "center",
                },
              ]}
              onPress={editable ? () => onElementPress?.(idx) : undefined}
            >
              <Text
                // Let text wrap within the container
                style={{
                  color,
                  fontWeight,
                  fontStyle,
                  textDecorationLine,
                  textAlign,
                  fontSize,
                  fontFamily,
                  width: "100%",
                  includeFontPadding: false,
                  letterSpacing,
                  lineHeight,
                }}
              >
                {String(el?.content ?? "")}
              </Text>
            </ElementContainer>
          );
        }

        if (
          (el?.type === "image" || el?.type === "socialIcon") &&
          el?.content
        ) {
          const uri = toAbs(String(el.content));
          const isSvg =
            uri && (uri.endsWith(".svg") || uri.startsWith("data:image/svg"));
          const resizeMode = toResizeMode(el?.style?.objectFit || "contain");
          const ElementContainer = editable ? Pressable : View;

          if (isSvg) {
            // Wrap to allow borderRadius clipping
            return (
              <ElementContainer
                key={idx}
                style={containerStyle}
                onPress={editable ? () => onElementPress?.(idx) : undefined}
              >
                <SvgUri
                  uri={uri}
                  width={width || size.w}
                  height={height || size.h}
                />
              </ElementContainer>
            );
          }

          return (
            <ElementContainer
              key={idx}
              style={containerStyle}
              onPress={editable ? () => onElementPress?.(idx) : undefined}
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={resizeMode}
              />
            </ElementContainer>
          );
        }

        if (el?.type === "divider") {
          const color = el?.style?.color || "#000";
          const thickness = toNum(el?.style?.borderWidth, 2) * scaleW;
          return (
            <View
              key={idx}
              style={[
                containerStyle,
                { padding: 0, backgroundColor: "transparent" },
              ]}
            >
              <View
                style={{
                  backgroundColor: color,
                  height: thickness,
                  width: "100%",
                }}
              />
            </View>
          );
        }

        return null;
      });
  };

  const Front = (
    <View style={styles.cardContainer} onLayout={onLayout}>
      <Background background={card?.layout?.background} />
      {renderElements(card?.layout?.elements)}
    </View>
  );
  const Back = (
    <View style={styles.cardContainer} onLayout={onLayout}>
      <Background background={card?.backLayout?.background} />
      {renderElements(card?.backLayout?.elements)}
      <QRBadge uri={card?.qrCodeUrl} />
    </View>
  );

  const showBack = side ? side === "verso" : flipped;

  // Animate the flip when showBack changes
  useEffect(() => {
    isFlipped.value = withTiming(showBack ? 1 : 0, { duration: 500 });
  }, [showBack, isFlipped]);

  const isDirectionX = false; // flip on Y axis
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
    const rotateValue = `${spinValue}deg`;
    return {
      transform: [
        { perspective: 1000 },
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        { scale: 1 },
      ],
    };
  });
  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
    const rotateValue = `${spinValue}deg`;
    return {
      transform: [
        { perspective: 1000 },
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        { scale: 1 },
      ],
    };
  });
  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.press}
        android_ripple={{ color: "#ddd" }}
        onPress={() => {
          if (!side && !editable) setFlipped((f) => !f);
        }}
        onLongPress={onPress}
        disabled={editable}
      >
        <View>
          <Animated.View
            style={[styles.flipFront, styles.flipBase, frontAnimatedStyle]}
          >
            {Front}
          </Animated.View>
          <Animated.View
            style={[styles.flipBack, styles.flipBase, backAnimatedStyle]}
          >
            {Back}
          </Animated.View>
        </View>
      </Pressable>
      <View style={styles.metaRow}>
        <Text style={styles.title} numberOfLines={1}>
          {card?.name || "Carte"}
        </Text>
        {card?.isActive ? <Text style={styles.star}>★</Text> : null}
      </View>
      {card?.matricule ? (
        <Text style={styles.matricule} numberOfLines={1}>
          Matricule: {card.matricule}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(MobileCard);

const styles = StyleSheet.create({
  wrapper: {
    padding: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    // subtle shadow/elevation
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  press: { width: "100%" },
  cardContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 7 / 4,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  flipBase: {
    width: "100%",
    aspectRatio: 7 / 4,
    backfaceVisibility: "hidden",
    borderRadius: 6,
  },
  flipFront: {
    position: "absolute",
    zIndex: 1,
  },
  flipBack: {
    zIndex: 2,
  },
  cardFace: { width: "100%", height: "100%" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  title: { fontWeight: "600", fontSize: 15, flex: 1, color: colors.surface },
  star: { color: "#f5b301", marginLeft: 6 },
  matricule: { marginTop: 2, color: colors.background },
  qrWrap: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 6,
    padding: 4,
  },
  qr: { width: 56, height: 56 },
});
