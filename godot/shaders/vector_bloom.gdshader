shader_type canvas_item;
render_mode unshaded;
// Board-local bloom, compatible with the existing Compatibility renderer.
// Sample the board SubViewport rather than the screen or opponent field.
uniform float bloom_strength : hint_range(0.0, 2.0) = 0.9;
uniform float impact_strength : hint_range(0.0, 1.0) = 0.0;
void fragment() {
    vec4 base = texture(TEXTURE, UV);
    vec2 px = TEXTURE_PIXEL_SIZE;
    vec3 bloom = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398163;
        vec2 d = vec2(cos(a), sin(a)) * px;
        vec3 c2 = texture(TEXTURE, clamp(UV + d * 2.0, vec2(0.0), vec2(1.0))).rgb;
        bloom += c2 * smoothstep(0.18, 0.7, max(c2.r, max(c2.g, c2.b))) * 0.055;
        vec3 c5 = texture(TEXTURE, clamp(UV + d * 5.0, vec2(0.0), vec2(1.0))).rgb;
        bloom += c5 * smoothstep(0.18, 0.7, max(c5.r, max(c5.g, c5.b))) * 0.045;
        vec3 c1 = texture(TEXTURE, clamp(UV + d * 10.0, vec2(0.0), vec2(1.0))).rgb;
        bloom += c1 * smoothstep(0.18, 0.7, max(c1.r, max(c1.g, c1.b))) * 0.025;
    }
    vec3 color = base.rgb + bloom * bloom_strength * (1.0 + impact_strength * 0.6);
    COLOR = vec4(color, max(base.a, max(bloom.r, max(bloom.g, bloom.b))));
}
