import React from "react";
import Lottie from "lottie-react";

const animationData = {
  "v": "5.7.6",
  "fr": 30,
  "ip": 0,
  "op": 180,
  "w": 500,
  "h": 500,
  "nm": "backpack-loading",
  "ddd": 0,
  "assets": [],
  "layers": [
    // -- sample minimal animation --
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Bag Shape",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [250, 250, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 1, "k": [
            { "t": 0, "s": [0, 0, 100], "e": [100, 100, 100], "i": { "x": [0.42], "y": [1] }, "o": { "x": [0.58], "y": [0] } },
            { "t": 40 }
          ]
        }
      },
      "shapes": [
        {
          "ty": "rc",
          "d": 1,
          "s": { "a": 0, "k": [120, 160] },
          "p": { "a": 0, "k": [0, 0] },
          "r": { "a": 0, "k": 20 },
          "nm": "Rectangle Path 1"
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.8, 0.5, 0.2, 1] },
          "o": { "a": 0, "k": 100 },
          "nm": "Fill 1"
        }
      ],
      "ip": 0,
      "op": 180,
      "st": 0,
      "bm": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Stuff Item",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [
            { "t": 0, "s": 0, "e": 100, "i": { "x": [0.42], "y": [1] }, "o": { "x": [0.58], "y": [0] } },
            { "t": 60 }
          ]
        },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 1, "k": [
            { "t": 0, "s": [250, 500, 0], "e": [250, 280, 0], "i": { "x": [0.42], "y": [1] }, "o": { "x": [0.58], "y": [0] } },
            { "t": 40 }
          ]
        },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [40, 40, 100] }
      },
      "shapes": [
        {
          "ty": "el",
          "p": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [40, 40] },
          "nm": "Ellipse Path"
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [1, 0.6, 0, 1] },
          "o": { "a": 0, "k": 100 },
          "nm": "Fill Yellow"
        }
      ],
      "ip": 0,
      "op": 180,
      "st": 0,
      "bm": 0
    }
  ]
};

const Loader = () => {
  return (
    <div style={styles.wrapper}>
      <Lottie animationData={animationData} loop={true} style={styles.lottie} />
      <p style={styles.text}>Packing your Rajasthani itinerary...</p>
    </div>
  );
};

const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#fdf1e3",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  lottie: {
    width: "280px",
    height: "280px",
  },
  text: {
    marginTop: "20px",
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#7c3f21",
    fontFamily: "'Segoe UI', sans-serif",
  },
};

export default Loader;
