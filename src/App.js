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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

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

            setData(parsed);
          },
        });
      });
  }, []);

  const topData = data.slice(0, 20);

  const chartData = {
    labels: topData.map((e) => e.nombre),
    datasets: [
      {
        label: "% de Ganancia",
        data: topData.map((e) => e.porcentaje),
        backgroundColor: (context) => {
          const index = context.dataIndex;
          const isSelected = selectedIndex === null || selectedIndex === index;

          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isSelected ? "#fdd835" : "rgba(253,216,53,0.2)");
          gradient.addColorStop(1, isSelected ? "#ff6f00" : "rgba(255,111,0,0.2)");
          return gradient;
        },
        borderRadius: 10,
        barThickness: 30,
        categoryPercentage: 0.5,
        barPercentage: 1.0,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "x",
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 14 },
          color: "#333",
        },
      },
      datalabels: {
        anchor: "end",
        align: "start",
        offset: -10,
        color: "#333",
        font: { weight: "bold", size: 12 },
        formatter: (val) => `${val.toFixed(2)}%`,
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
          callback: (val) => `${val}%`,
          font: { size: 14 },
        },
        grid: { color: "#e0e0e0" },
      },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 13 },
        },
        grid: { display: false },
      },
    },
    animation: {
      duration: 1000,
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
        }}
      >
        <img
          src="/logo_hydra.png"
          alt="Logo empresa"
          style={{ height: "40px", objectFit: "contain" }}
        />
        <h2 style={{ margin: 0, color: "#333" }}>
          Ranking Mensual de Ganancia en HYDRA S.A.S.
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "40px",
          flexWrap: "wrap",
          padding: "20px",
        }}
      >
        {/* Tabla */}
        <table
          style={{
            borderCollapse: "collapse",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ padding: "10px 20px", textAlign: "center" }}>
                Orden
              </th>
              <th style={{ padding: "10px 20px", textAlign: "center" }}>
                Nombre
              </th>
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
                  <td style={{ padding: "8px 20px", textAlign: "center" }}>
                    {medal || item.orden}
                  </td>
                  <td style={{ padding: "8px 20px" }}>{item.nombre}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Gráfico */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            padding: "20px",
            maxWidth: "1000px",
            flex: "1",
          }}
        >
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Indicador "En vivo" */}
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
