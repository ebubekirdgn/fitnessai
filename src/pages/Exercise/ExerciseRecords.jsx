import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchExerciseRecords, fetchMe } from '../../api';
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ExerciseRecords() {
  const [user, setUser] = useState({});
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all'); // 'all', 'monthly', 'weekly'
  const [selectedExercise, setSelectedExercise] = useState('Biceps Curl'); // Varsayılan olarak Biceps Curl
  const chartRef = useRef(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await fetchMe();
        setUser(data);
      } catch (error) {
        toast.error(`Kullanıcı verileri alınırken bir hata oluştu: ${error.message}`);
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  useEffect(() => {
    const getRecords = async () => {
      try {
        if (!user.id) {
          throw new Error('User ID not found');
        }
        const data = await fetchExerciseRecords(user.id);
        if (!Array.isArray(data)) {
          throw new Error('Fetched records are not an array');
        }
        setRecords(data);
      } catch (error) {
        toast.error(`Egzersiz kayıtları alınırken bir hata oluştu: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      getRecords();
    }
  }, [user]);

  const handleExportPDF = () => {
    const input = chartRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save("exercise_records.pdf");
    });
  };

  const filterRecords = (records, timeFrame) => {
    const now = new Date();
    return records.filter(record => {
      const recordDate = new Date(record.createdDate);
      if (timeFrame === 'monthly') {
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      } else if (timeFrame === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return recordDate >= oneWeekAgo && recordDate <= now;
      } else {
        return true;
      }
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const filteredRecords = filterRecords(records, timeFrame);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!records || records.length === 0) {
    return <div className="text-center mt-5">No exercise records found.</div>;
  }

  // const exerciseNames = ['Biceps Curl', 'Squat', 'Crunch', 'Lateral Raise', 'Triceps Extension', 'Shoulder Press'];
  // const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1'];

  const exerciseNames = ['Biceps Curl', 'Squat', 'Triceps Extension', 'Shoulder Press'];
  const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];

  const datasets = [
    {
      label: 'Correct',
      data: filteredRecords.filter(record => record.exercise.name === selectedExercise).map(record => record.correct),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Incorrect',
      data: filteredRecords.filter(record => record.exercise.name === selectedExercise).map(record => record.incorrect),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: true,
      tension: 0.4,
    }
  ];

  const data = {
    labels: filteredRecords.filter(record => record.exercise.name === selectedExercise).map(record => formatDate(record.createdDate)),
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="container mt-5">
      <div className="section-heading">
        <h2>
          My <em>Statistics</em>
        </h2>
      </div>

      <div ref={chartRef} className="mb-4" style={{ position: "relative", height: "60vh", width: "100%" }}>
        <Line data={data} options={options} />
      </div>
      <div className="d-flex justify-content-center mt-4">
        {exerciseNames.map((name, index) => (
          <div
            key={name}
            className="me-3"
            style={{
              cursor: 'pointer',
              color: selectedExercise === name ? colors[index % colors.length] : '#000',
              fontWeight: selectedExercise === name ? 'bold' : 'normal'
            }}
            onClick={() => setSelectedExercise(selectedExercise === name ? null : name)}
          >
            {name}
          </div>
        ))}
      </div>
      <br></br>
      <div className="d-flex justify-content-center mb-4">
        <div className="d-flex align-items-end">
          <div className="me-3">
            <select id="timeFrame" className="form-select" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
              <option value="all">All</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleExportPDF}>Dışarı Aktar (PDF)</button>
        </div>
      </div>
    </div>
  );
}

export default ExerciseRecords;