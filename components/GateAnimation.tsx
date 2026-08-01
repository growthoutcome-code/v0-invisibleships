// Welcome-screen hero animation: four line-drawing scenes crossfading over a
// 12s loop. Monochrome; inverts for dark via the site's `.dark` theme class
// (see globals.css .gate-anim rules). Final "headset" scene holds ~2.5s.
//
// `fill` = cover the parent container (used for the 2-up welcome layout);
// default = a width-constrained band.
export default function GateAnimation({ fill = false }: { fill?: boolean }) {
  const scenes = (
    <>
      <rect className="ga-bg" width="1440" height="810" />
      <image className="ga-scene ga-s1" href="/anim/is-scene-1.webp" x="0" y="0" width="1440" height="810" preserveAspectRatio={fill ? "xMidYMid slice" : "none"} />
      <image className="ga-scene ga-s2" href="/anim/is-scene-2.webp" x="0" y="0" width="1440" height="810" preserveAspectRatio={fill ? "xMidYMid slice" : "none"} />
      <image className="ga-scene ga-s3" href="/anim/is-scene-3.webp" x="0" y="0" width="1440" height="810" preserveAspectRatio={fill ? "xMidYMid slice" : "none"} />
      <image className="ga-scene ga-sq" href="/anim/is-quality.webp" x="0" y="0" width="1440" height="810" preserveAspectRatio={fill ? "xMidYMid slice" : "none"} />
    </>
  );

  if (fill) {
    return (
      <div className="gate-anim is-fill absolute inset-0 select-none" aria-hidden="true">
        <svg viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
          {scenes}
        </svg>
      </div>
    );
  }

  return (
    <div className="gate-anim mx-auto mb-8 w-full max-w-2xl select-none" aria-hidden="true">
      <svg viewBox="0 0 1440 810" className="block h-auto w-full">
        {scenes}
      </svg>
    </div>
  );
}
