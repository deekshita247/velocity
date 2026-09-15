import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as THREE from "three";

export interface SpineMetadata {
  name?: string;
  type?: number;
  attributes?: Array<[string, number]>;
}

// Cache the decoded source; each mounted mesh owns a clone it may safely dispose.
const decodedSources = new Map<string, Promise<THREE.BufferGeometry>>();
export async function loadSpineGeometry(url: string): Promise<THREE.BufferGeometry> {
  let source = decodedSources.get(url);
  if (!source) {
    source = decodeSpineGeometry(url).catch(error => { decodedSources.delete(url); throw error; });
    decodedSources.set(url, source);
  }
  return (await source).clone();
}

async function decodeSpineGeometry(url: string): Promise<THREE.BufferGeometry> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch spine asset: ${response.status} ${response.statusText} (${url})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  const dracoMarker = "DRACO";
  const markerIndex = rawBytes.findIndex((value, index, list) => {
    if (index + dracoMarker.length > list.length) {
      return false;
    }

    return String.fromCharCode(...list.slice(index, index + dracoMarker.length)) === dracoMarker;
  });

  if (markerIndex === -1) {
    const preview = Array.from(rawBytes.slice(0, 64))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");

    throw new Error(`spine.bin did not contain the DRACO marker. Preview: ${preview}`);
  }

  const metadataStart = 10;
  const metadataEnd = markerIndex;
  const metadataBytes = rawBytes.slice(metadataStart, metadataEnd);
  const metadataText = new TextDecoder().decode(metadataBytes);

  let metadata: SpineMetadata = {};
  try {
    metadata = JSON.parse(metadataText);
  } catch (error) {
    throw new Error(
      `Failed to parse spine metadata JSON. Marker index: ${markerIndex}. Metadata text: ${metadataText}. Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (metadata.name !== "spine") {
    throw new Error(`Unexpected spine metadata name: ${metadata.name ?? "undefined"}`);
  }

  // The custom wrapper stores the Draco payload immediately after the metadata.
  // The actual Draco stream includes the leading "DRACO" magic bytes, so the
  // decoder must receive the buffer starting at the marker itself.
  const dracoPayload = arrayBuffer.slice(markerIndex);

  const dracoLoader = new DRACOLoader();

  try {
    const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
      dracoLoader.parse(dracoPayload, (decodedGeometry: THREE.BufferGeometry) => {
        resolve(decodedGeometry);
      }, reject);
    });

    if (process.env.NODE_ENV === "development") {
      const attributes = Object.keys(geometry.attributes);
      const positionCount = geometry.attributes.position?.count ?? 0;
      const indexCount = geometry.index ? geometry.index.count : 0;

      console.log("[spine] decoded attributes:", attributes);
      console.log("[spine] vertex count:", positionCount);
      console.log("[spine] index count:", indexCount);
    }

    return geometry;
  } catch (error) {
    const preview = Array.from(rawBytes.slice(0, 64))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");

    throw new Error(
      `DRACOLoader decode failed. markerIndex=${markerIndex}, payloadBytes=${dracoPayload.byteLength}, metadataText=${metadataText}, preview=${preview}. Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    dracoLoader.dispose();
  }
}
