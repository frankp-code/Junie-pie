import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend
);

export const ActivityFrequencyChart = ({ data }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activity Frequency',
      },
    },
  };

  return <Bar options={options} data={data} />;
}

export const ActivityTrendChart = ({ data }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activity Trends (Last 7 Days)',
      },
    },
  };

  return <Line options={options} data={data} />;
}
