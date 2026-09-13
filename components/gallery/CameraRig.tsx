"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { createGalleryPath, getHelixPanelPlacement, photographs, safeProgress } from "./galleryData";
import { useGalleryInteraction } from "./GalleryInteraction";

export function CameraRig() {
  const { locked } = useGalleryInteraction();
  const scroll = useScroll();
  const mobile = useThree((state) => state.size.width < 768);
  const path = useMemo(() => createGalleryPath(mobile), [mobile]);
  const panels = useMemo(() => photographs.map((_, i) => getHelixPanelPlacement(i, mobile).position), [mobile]);
  const position = useRef(new Vector3());
  const desiredLook = useRef(new Vector3(0, 2.5, 0));
  const look = useRef(new Vector3(0, 2.5, 0));

  const lastProgress=useRef(0);
  useFrame(({ camera, pointer }, delta) => {
    if (locked.current) return;
    const p = safeProgress(scroll.offset,lastProgress.current);
    lastProgress.current=p;
    const dt = Math.min(delta, 0.05);
    path.getPointAt(p, position.current);
    // Frame the artwork without changing the camera's path or any card transform.
    // Hold each card near center, then smoothly hand attention to the next one.
    let next = photographs.findIndex(photo => photo.t >= p);
    if (next < 0) next = photographs.length - 1;
    const previous = Math.max(0, next - 1);
    const span = photographs[next].t - photographs[previous].t;
    const blend = span > 0 ? MathUtils.smoothstep((p - photographs[previous].t) / span, 0.2, 0.8) : 0;
    desiredLook.current.lerpVectors(panels[previous], panels[next], blend);
    // A very small inward bias retains a glimpse of the spine beside the photograph.
    desiredLook.current.x *= 0.97;
    desiredLook.current.z *= 0.97;
    const angle = Math.atan2(position.current.z, position.current.x);
    position.current.x += -Math.sin(angle) * pointer.x * 0.07;
    position.current.z += Math.cos(angle) * pointer.x * 0.07;
    position.current.y += pointer.y * 0.045;
    camera.position.lerp(position.current, 1 - Math.exp(-(mobile ? 3 : 4.5) * dt));
    look.current.lerp(desiredLook.current, 1 - Math.exp(-3.5 * dt));
    camera.lookAt(look.current);
    camera.rotateZ(Math.sin(p * Math.PI * 2) * 0.018);
  });
  return null;
}
