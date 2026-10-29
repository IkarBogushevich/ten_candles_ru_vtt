import { memo } from "react"
import Particles from "react-particles"

const SmokeParticles = memo(function SmokeParticles({ candleIndex }: { candleIndex: number }) {
  return (
    <Particles
      className="absolute -top-[150px] -left-[136px] w-[400px] h-[300px] pointer-events-none"
      id={`smoke-${candleIndex}`}
      options={{
        fpsLimit: 60,
        fullScreen: false,
        particles: {
          color: { value: "#a1a1a1" },
          life: { count: 1, duration: { value: { min: 1, max: 3 } } },
          move: {
            enable: true,
            speed: 2,
            angle: { value: 0, offset: { min: -100, max: 100 } },
            drift: 2,
          },
          opacity: {
            animation: {
              enable: true,
              speed: { min: 2, max: 33 },
              delay: 0,
              sync: false,
              startValue: "random",
              count: 1,
              mode: "decrease",
              opacity_min: 0,
            },
          },
          shape: {
            type: "square",
          },
          size: {
            value: 5,
          },
        },
        emitters: {
          direction: "top",
          life: { duration: 0.4, count: 1 },
          rate: {
            quantity: 50,
          },
          size: {
            width: 5,
            height: 5,
            mode: "precise",
          },
          position: {
            x: 50,
            y: 50,
          },
        },
        detectRetina: true,
      }}
    />
  )
})

export default SmokeParticles
