import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const ParticlesBackground = () => {
    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    const particlesOptions = {
        background: {
            color: { value: "transparent" }
        },
        fpsLimit: 60,
        particles: {
            color: { value: "#8590AA" },
            links: {
                color: "#8590AA",
                distance: 150,
                enable: true,
                opacity: 0.7,
                width: 2.5
            },
            move: {
                enable: true,
                direction: "none",
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false
            },
            number: {
                density: { enable: true, area: 800 },
                value: 80
            },
            opacity: { value: 0.8 },
            shape: { type: "circle" },
            size: { value: { min: 3, max: 6 } }
        },
        detectRetina: true
    };

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesOptions}
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: -1
            }}
        />
    );
};

export default ParticlesBackground;