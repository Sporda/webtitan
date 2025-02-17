import { RefObject } from "react";
import { Defs } from "./defs/Defs";
import { Birds } from "./birds/Birds";
import { Clouds } from "./clouds/Clouds";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene1 } from "./scenes/Scene1";
interface MainSvgProps {
  svgRef: RefObject<SVGSVGElement | null>;
}

export const MainSvg = ({ svgRef }: MainSvgProps) => {
  return (
    <div className="parallax-wrapper" style={{ position: "relative" }}>
      {/* Hlavní SVG */}
      <svg
        ref={svgRef}
        className="parallax"
        viewBox="0 0 750 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs />

        <rect
          id="bg"
          width="750"
          height="500"
          opacity="0.8"
          fill="url(#bg_grad)"
        />

        <Clouds />

        {/* <!-- SCENE 2 --> */}
        <Scene2 />

        {/* <!-- SCENE 3 --> */}
        <Scene3 />

        {/* <!-- SCENE 1 --> */}
        <Scene1 />
      </svg>

      {/* Ptáci před SVG */}
      <Birds />
    </div>
  );
};
