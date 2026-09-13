import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

const validPortfolioExtensions = /\.(jpe?g|webp)$/i;

export function normalizePortfolioImagePath(image: string) {
  const normalized = image.trim();
  if (!validPortfolioExtensions.test(normalized)) {
    console.warn(`[gallery] Unsupported portfolio asset "${normalized}". Expected a .jpg, .jpeg, or .webp file.`);
  }
  return normalized;
}

const gallerySeed = [
  { title: "BRAKING POINT", name: "Green racing line", image: "/portfolio/c9.jpeg", description: "Commitment at the braking point.", t: 0.10 },
  { title: "LIGHTS OUT", name: "Purple pursuit", image: "/portfolio/c13.jpeg", description: "Endurance at speed.", t: 0.25 },
  { title: "APEX HUNTER", name: "Across the apex", image: "/portfolio/c3.jpg", description: "A precise line through the corner.", t: 0.40 },
  { title: "SLIPSTREAM", name: "Blue in motion", image: "/portfolio/c6.jpeg", description: "Chasing the air.", t: 0.55 },
  { title: "PIT WINDOW", name: "Race rhythm", image: "/portfolio/c17.jpeg", description: "Every second counts.", t: 0.70 },
  { title: "NIGHT STINT", name: "After the light", image: "/portfolio/c7.jpeg", description: "Speed after dark.", t: 0.84 },
] as const;

export const photographs = gallerySeed.map((photo, index) => ({
  ...photo,
  galleryImage: normalizePortfolioImagePath(photo.image),
  effect: (["rotate-scroll", "mask-reveal", "velocity-parallax", "lens", "light-trail", "velocity-parallax"] as const)[index % 6],
}));

export function safeProgress(value:number, fallback=0) { return Number.isFinite(value) ? MathUtils.clamp(value,0,1) : fallback; }
export type Photograph = (typeof photographs)[number];
export const photoUrl = (image: string, size?: number) => { void size; return image; };

// A little over one revolution, descending twelve world units.
const startAngle = -0.6;
const sweep = Math.PI * 2.15;
export const galleryTravelEnd = 0.95;

export function createGalleryPath(mobile: boolean) {
  const radius = mobile ? 8.4 : 9.2;
  const points = Array.from({ length: 10 }, (_, i) => {
    const p = i / 9;
    const angle = startAngle + sweep * p;
    const r = radius + Math.sin(p * Math.PI) * 0.18;
    return new Vector3(Math.cos(angle) * r, 3 - p * 12, Math.sin(angle) * r);
  });
  if (points.length<2 || points.some(point=>!point.isVector3 || ![point.x,point.y,point.z].every(Number.isFinite))) throw new Error("Invalid gallery camera control points");
  return new CatmullRomCurve3(points, false, "centripetal");
}

// These placements are computed once, not translated by the scroll animation.
export function getHelixPanelPlacement(index: number, mobile: boolean) {
  const anchor = photographs[index].t;
  const angle = startAngle + sweep * anchor - 0.38;
  const radius = mobile ? 5.8 : 6.2;
  return {
    position: new Vector3(Math.cos(angle) * radius, 2.5 - anchor * 12, Math.sin(angle) * radius),
    // Face the walking path outside the column, without turning toward it each frame.
    rotationY: Math.PI / 2 - angle,
  };
}

export function getPhotoInfluence(progress: number, anchor: number) {
  return Math.exp(-Math.pow((progress - anchor) / 0.085, 2));
}

export function getActivePhoto(progress: number) {
  return photographs.reduce((best, photo, index) =>
    Math.abs(progress - photo.t) < Math.abs(progress - photographs[best].t) ? index : best, 0);
}

export function getGalleryProgress(rawProgress: number) {
  // Leave the final 5% pinned so the damped camera settles before DOM release.
  return safeProgress(rawProgress / galleryTravelEnd);
}
