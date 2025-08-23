import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { colors } from "../theme/theme";

export default function ImageWithLoader({ uri, style }) {
  const [loading, setLoading] = React.useState(true);
  return (
    <View
      style={[
        style,
        {
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        },
      ]}
    >
      <Image
        source={{ uri }}
        style={[style, { position: "absolute", top: 0, left: 0 }]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
    </View>
  );
}
