/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#f1f1f1",
        grey: "#48413e",
        lightgrey: "#534e4e",
        black: "rgb(16, 16, 15)",
        darkgrey: "#231d1b",
        yellow: "#FFC35A",
        orange: "#dd7d4e",
        red: "#e6321e",
        green: "#609350",
        lightblue: "#6ed8e0",
        blue: "#306695",
        brown: "#7a4e1d",
        orangeTransparent: "rgb(240, 130, 75, 0.3)",
      },
      screens: {
        xs: "480px",
      },
      fontFamily: {
        pixel: ["PixeloidSans"],
      },
      fontSize: {
        "1.5xl": "1.35rem",
      },
      borderWidth: {
        3: "3px",
        6: "6px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
