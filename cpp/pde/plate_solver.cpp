#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace chladni {

struct PlateParams {
  std::uint32_t width;
  std::uint32_t height;
  float stiffness;
  float damping;
  float drive;
  float frequency;
  float time;
  float modeX;
  float modeY;
  float audioBass;
  float audioMid;
  float audioHigh;
};

static float modalShape(float x, float y, const PlateParams& p) {
  constexpr float pi = 3.14159265358979323846f;
  const float base = std::sin(pi * p.modeX * x) * std::sin(pi * p.modeY * y);
  const float bass = p.audioBass * std::sin(pi * x) * std::sin(pi * y);
  const float mid = p.audioMid * std::sin(2.0f * pi * x) * std::sin(3.0f * pi * y);
  const float high = p.audioHigh * std::sin(5.0f * pi * x) * std::sin(4.0f * pi * y);
  return base + bass + mid + high;
}

void stepPlate(const std::vector<float>& current,
               const std::vector<float>& previous,
               std::vector<float>& next,
               const PlateParams& p) {
  next.assign(current.size(), 0.0f);
  if (p.width < 5 || p.height < 5) {
    return;
  }

  constexpr float pi = 3.14159265358979323846f;
  const float omega = 2.0f * pi * p.frequency;

  for (std::uint32_t y = 2; y + 2 < p.height; ++y) {
    for (std::uint32_t x = 2; x + 2 < p.width; ++x) {
      const std::uint32_t i = y * p.width + x;
      const float c = current[i];
      const float n = current[i - p.width];
      const float s = current[i + p.width];
      const float e = current[i + 1];
      const float w = current[i - 1];
      const float ne = current[i - p.width + 1];
      const float nw = current[i - p.width - 1];
      const float se = current[i + p.width + 1];
      const float sw = current[i + p.width - 1];
      const float nn = current[i - 2 * p.width];
      const float ss = current[i + 2 * p.width];
      const float ee = current[i + 2];
      const float ww = current[i - 2];

      const float biharmonic = 20.0f * c - 8.0f * (n + s + e + w) +
                               2.0f * (ne + nw + se + sw) + (nn + ss + ee + ww);
      const float fx = static_cast<float>(x) / static_cast<float>(p.width - 1);
      const float fy = static_cast<float>(y) / static_cast<float>(p.height - 1);
      const float forcing = p.drive * modalShape(fx, fy, p) * std::sin(omega * p.time);
      const float velocity = c - previous[i];
      next[i] = (2.0f * c - previous[i]) + velocity * (1.0f - p.damping) -
                p.stiffness * biharmonic + forcing;
      next[i] = std::clamp(next[i], -1.0f, 1.0f);
    }
  }
}

}  // namespace chladni
