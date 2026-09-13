// Shared artwork thumbnail for the racing media sequence.
export const raceImage = "/portfolio/c10.jpeg";
export const raceFrames = [
  { title: "APEX", name: "At the limit", description: "Commitment at the edge of grip. Late braking, compression and the instant a racing line becomes irreversible.", position: "50% 60%" },
  { title: "GRID", name: "Before the release", description: "Before the launch, machines and drivers wait inside a few metres of controlled tension.", position: "65% 45%" },
  { title: "VELOCITY", name: "Nothing stands still", description: "Panning, compression and aerodynamic form captured where the subject almost outruns the frame.", position: "40% 55%" },
  { title: "PITLANE", name: "Precision under pressure", description: "Milliseconds measured in hands, tyres and choreography. The race behind the race.", position: "80% 60%" },
  { title: "AFTER DARK", name: "Following the light", description: "Headlights, brake glow and floodlit asphalt transform the circuit after sunset.", position: "50% 75%" },
  { title: "SLIPSTREAM", name: "Chasing the air", description: "A study of shape, pressure and the narrow space between pursuit and escape.", position: "30% 50%" },
].map((frame, index) => ({ ...frame, effect: (["rotate-scroll","mask-reveal","velocity-parallax","lens","light-trail","velocity-parallax"] as const)[index], image: raceImage, id: index, location: "FORM / SPEED STUDY", event: "SELECTED FRAMES / 2026" }));
