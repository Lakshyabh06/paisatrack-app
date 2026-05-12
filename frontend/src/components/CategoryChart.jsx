import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function CategoryChart({ data }) {
  if (!data) return null;

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Spending",
        data: Object.values(data),
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  };

  return <Bar data={chartData} options={options} />;
}
