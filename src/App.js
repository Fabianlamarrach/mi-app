import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Papa from "papaparse";
import "./App.css";
import "@fontsource/montserrat";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/700.css";

Chart.register(ChartDataLabels);

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNxsbAUqoxJNXs9Atk0zBfpbvxqHx2YpEQ1-fGSFYB3yZ-N4pAqMitScikOCnaKkVKKfADzn1xrUuj/pub?gid=0&single=true&output=csv";

export default function App() {
  const [data, setData] = useState([]);
  const [rankingAnterior, setRankingAnterior] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(SHEET_URL)
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            const rawData = results.data;

            const parsed = rawData
              .map((row) => {
                const nombre = row["Personas con Buenos Nombres"];
                const porcentajeTexto = row["% de Ganancia"];
                const ordenTexto = row["Orden"];

                const porcentaje = parseFloat(
                  porcentajeTexto?.replace("%", "").replace(",", ".")
                );
                const orden = parseInt(ordenTexto);

                if (!nombre || isNaN(porcentaje) || isNaN(orden)) return null;

                return {
                  nombre: nombre.trim(),
                  porcentaje,
                  orden,
                };
              })
              .filter((e) => e !== null)
              .sort((a, b) => a.orden - b.orden);

            // Cargar ranking anterior desde localStorage
            const anterior = JSON.parse(localStorage.getItem("rankingAnterior") || "[]");
            setRankingAnterior(anterior);

            // Guardar ranking actual como nuevo "anterior"
            localStorage.setItem("rankingAnterior", JSON.stringify(parsed));

            setData(parsed);
          },
        });
      });
  }, []);

  function obtenerMovimiento(nombre, actualOrden) {
    const anterior = rankingAnterior.find((p) => p.nombre === nombre);
    if (!anterior) return null;

    if (actualOrden < anterior.orden) return "sube";
    if (actualOrden > anterior.orden) return "baja";
    return null;
  }

  const topData = data.slice(0, 20);
  const chartDataLimited = isMobile ? data.slice(0, 10) : data.slice(0, 20);

  const chartData = {
    labels: chartDataLimited.map((e) => {
      return isMobile && e.nombre.length > 12
        ? e.nombre.substring(0, 12) + "..."
        : e.nombre;
    }),
    datasets: [
      {
        label: "% de Ganancia",
        data: chartDataLimited.map((e) => e.porcentaje),
        backgroundColor: (context) => {
          const index = context.dataIndex;
          const isSelected = selectedIndex === null || selectedIndex === index;

          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isSelected ? "#fdd835" : "rgba(253,216,53,0.2)");
          gradient.addColorStop(1, isSelected ? "#ff6f00" : "rgba(255,111,0,0.2)");
          return gradient;
        },
        borderRadius: 8,
        barThickness: isMobile ? 25 : "flex",
        maxBarThickness: isMobile ? 35 : 80,
        categoryPercentage: isMobile ? 0.8 : 0.7,
        barPercentage: isMobile ? 0.9 : 0.7,
      },
    ],
  };

  const chartOptions = {
    indexAxis: isMobile ? "y" : "x",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: isMobile ? 10 : 20,
        bottom: isMobile ? 10 : 40,
        left: isMobile ? 10 : 20,
        right: isMobile ? 10 : 20,
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Ranking de % de Ganancia por Persona",
        font: {
          size: isMobile ? 12 : 20,
          weight: "bold",
        },
        padding: {
          top: isMobile ? 2 : 10,
          bottom: isMobile ? 6 : 20,
        },
        color: "#333",
      },
      legend: {
        display: !isMobile,
        position: "top",
        labels: {
          font: { size: 14 },
          color: "#333",
        },
      },
      datalabels: {
        anchor: isMobile ? "center" : "end",
        align: isMobile ? "center" : "start",
        offset: isMobile ? 0 : -10,
        color: "#333",
        font: {
          weight: "bold",
          size: isMobile ? 10 : 12,
        },
        formatter: (val) => `${val.toFixed(1)}%`,
        display: function (context) {
          if (isMobile) {
            const barCount = context.chart.data.labels.length;
            return barCount <= 10;
          }
          return true;
        },
      },
    },
    onClick: (evt, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedIndex(index);
      } else {
        setSelectedIndex(null);
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
        ticks: {
          callback: (val) => (isMobile ? `${val + 1}` : `${val}%`),
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
          color: "#333",
          padding: isMobile ? 5 : 10,
          maxTicksLimit: isMobile ? 10 : undefined,
        },
        grid: {
          color: "#e0e0e0",
          display: !isMobile,
        },
      },
      x: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
          color: "#333",
          padding: isMobile ? 5 : 8,
          maxTicksLimit: isMobile ? 10 : undefined,
          maxRotation: 60,
          minRotation: 35,
          autoSkip: false,
        },
        grid: {
          display: true,
          color: "#e0e0e0",
        },
      },
    },
    animation: {
      duration: isMobile ? 500 : 1000,
      easing: "easeOutBounce",
    },
  };

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          margin: "20px 0",
          flexWrap: "wrap",
        }}
      >
        <img
          src="/logo_hydra.png"
          alt="Logo empresa"
          style={{ height: "40px", objectFit: "contain" }}
        />
        <h2
          style={{
            margin: 0,
            color: "#333",
            fontSize: isMobile ? "18px" : "24px",
            textAlign: "center",
          }}
        >
          Ranking Mensual de Ganancia en HYDRA S.A.S.
        </h2>
      </div>

      <div className="ranking-container">
        <div className="table-container">
          <table
            style={{
              borderCollapse: "collapse",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#fff",
              width: "100%",
              minWidth: "280px",
              maxWidth: "400px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f4f4f4" }}>
                <th style={{ padding: "10px 20px", textAlign: "center" }}>Orden</th>
                <th style={{ padding: "10px 20px", textAlign: "center" }}>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {topData.map((item, index) => {
                let medal = "";
                if (index === 0) medal = "🥇";
                else if (index === 1) medal = "🥈";
                else if (index === 2) medal = "🥉";

                const isSelected = selectedIndex === index;

                return (
                  <tr
                    key={item.orden}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() =>
                      setSelectedIndex(selectedIndex === index ? null : index)
                    }
                    style={{
                      backgroundColor: isSelected
                        ? "#ffe082"
                        : hoveredIndex === index
                        ? "#fef3c7"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      fontWeight: index < 3 ? "bold" : "normal",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 20px",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {medal || item.orden}
                      {(() => {
                        const movimiento = obtenerMovimiento(item.nombre, item.orden);
                        if (movimiento === "sube")
                          return <span style={{ color: "green" }}>⬆️</span>;
                        if (movimiento === "baja")
                          return <span style={{ color: "red" }}>⬇️</span>;
                        return null;
                      })()}
                    </td>
                    <td style={{ padding: "8px 20px" }}>{item.nombre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <div className="chart-wrapper">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#e53935",
          color: "white",
          padding: "10px 16px",
          borderRadius: "30px",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          zIndex: 1000,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            animation: "pulse 1s infinite",
          }}
        />
        En vivo
      </div>
    </div>
  );
}
