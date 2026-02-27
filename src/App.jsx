import { useState, useMemo, useEffect } from 'react';
import texts from './assets/text.json';

export default function App() {
    const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");
    const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

    const t = texts[language];

    const [a, setA] = useState(1);
    const [b, setB] = useState(0);
    const [c, setC] = useState(0);
    const [mode, setMode] = useState("quadratic");

    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);

    const width = 600;
    const height = 600;
    const scale = 40;

    const generatePoints = (count) => {
        const usedX = new Set();
        const points = [];

        while (points.length < count) {
            const x = Math.floor(Math.random() * 8 - 4);
            if (usedX.has(x)) continue;
            usedX.add(x);
            points.push({
                x,
                y: Math.floor(Math.random() * 8 - 4)
            });
        }

        return points;
    };

    const getPointCount = () => {
        if (mode === "linear") return 2;
        if (mode === "quadratic") return 3;
        if (mode === "cubic") return 4;
    };

    const [targetPoints, setTargetPoints] = useState(() =>
        generatePoints(getPointCount())
    );

    const toCanvasX = (x) => width / 2 + x * scale;
    const toCanvasY = (y) => height / 2 - y * scale;

    const computeY = (x) => {
        if (mode === "linear") return a * x + b;
        if (mode === "quadratic") return a * x * x + b * x + c;
        if (mode === "cubic") return a * x * x * x + b * x + c;
        return 0;
    };

    const graphPath = useMemo(() => {
        let path = "";
        for (let x = -8; x <= 8; x += 0.05) {
            const y = computeY(x);
            const px = toCanvasX(x);
            const py = toCanvasY(y);
            if (x === -8) path += `M ${px} ${py}`;
            else path += ` L ${px} ${py}`;
        }
        return path;
    }, [a, b, c, mode]);

    const nextLevel = () => {
        setTargetPoints(generatePoints(getPointCount()));
        setA(1);
        setB(0);
        setC(0);
    };

    const checkSolution = () => {
        const tolerance = 0.4;
        const allGood = targetPoints.every((p) => {
            const y = computeY(p.x);
            return Math.abs(y - p.y) < tolerance;
        });

        setSuccess(allGood);
        setShowModal(true);
    };

    const toggleTheme = () => {
        const newTheme = !dark;
        setDark(newTheme);
        localStorage.setItem("theme", newTheme ? "dark" : "light");
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem("lang", lang);
    };

    useEffect(() => {
        nextLevel();
    }, [mode]);

    return (
        <div className={`page ${dark ? "dark" : ""}`}>
            <div className="top-bar">
                <div className="top-controls">
                    <button className="glass-btn" onClick={toggleTheme}>
                        {dark ? t.light : t.dark}
                    </button>
                    <button className="glass-btn accent" onClick={() =>
                        changeLanguage(language === "en" ? "ru" : "en")
                    }>
                        {language === "en" ? "RU" : "EN"}
                    </button>
                </div>
            </div>

            <div className="container">
                <Graph
                    width={width}
                    height={height}
                    scale={scale}
                    graphPath={graphPath}
                    targetPoints={targetPoints}
                    toCanvasX={toCanvasX}
                    toCanvasY={toCanvasY}
                />

                <div className="card left">
                    <h2>{t.title}</h2>

                    <select value={mode} onChange={(e) => setMode(e.target.value)} className="select">
                        <option value="linear">{t.linear}</option>
                        <option value="quadratic">{t.quadratic}</option>
                        <option value="cubic">{t.cubic}</option>
                    </select>

                    <div className="equation">
                        {mode === "linear" && `y = ${a.toFixed(2)}x + ${b.toFixed(2)}`}
                        {mode === "quadratic" && `y = ${a.toFixed(2)}x² + ${b.toFixed(2)}x + ${c.toFixed(2)}`}
                        {mode === "cubic" && `y = ${a.toFixed(2)}x³ + ${b.toFixed(2)}x + ${c.toFixed(2)}`}
                    </div>

                    <Slider label="a" value={a} setValue={setA} />
                    <Slider label="b" value={b} setValue={setB} />
                    {mode !== "linear" && <Slider label="c" value={c} setValue={setC} />}

                    <button className="primary-btn" onClick={checkSolution}>
                        {t.check}
                    </button>
                </div>
            </div>

            {showModal && <Modal
                success={success}
                message={success ? t.success : t.fail}
                buttonText={success ? t.next : t.retry}
                onClose={() => {
                    setShowModal(false);
                    if (success) nextLevel();
                }}
            />}
        </div>
    );
}

function Graph({ width, height, scale, graphPath, targetPoints, toCanvasX, toCanvasY }) {
    const gridCount = width / scale;

    return (
        <div className="card graph-card">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="graph-svg">
                {[...Array(gridCount + 1)].map((_, i) => {
                    const pos = i * scale;
                    return (
                        <g key={i}>
                            <line x1={pos} y1={0} x2={pos} y2={height} className="grid-line" />
                            <line x1={0} y1={pos} x2={width} y2={pos} className="grid-line" />
                        </g>
                    );
                })}

                {[...Array(gridCount + 1)].map((_, i) =>
                    [...Array(gridCount + 1)].map((_, j) => (
                        <circle key={`${i}-${j}`} cx={i * scale} cy={j * scale} r={2} className="grid-dot" />
                    ))
                )}

                <line x1={0} y1={height / 2} x2={width} y2={height / 2} className="axis" />
                <line x1={width / 2} y1={0} x2={width / 2} y2={height} className="axis" />

                <path d={graphPath} className="curve" />

                {targetPoints.map((p, i) => (
                    <circle key={i} cx={toCanvasX(p.x)} cy={toCanvasY(p.y)} r={9} className="target-point" />
                ))}
            </svg>
        </div>
    );
}

function Slider({ label, value, setValue }) {
    return (
        <div className="slider">
            <label>{label}</label>
            <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
            />
        </div>
    );
}

function Modal({ success, message, buttonText, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal ${success ? "success" : "fail"}`} onClick={(e) => e.stopPropagation()}>
                <h2>{message}</h2>
                <button onClick={onClose}>{buttonText}</button>
            </div>
        </div>
    );
}