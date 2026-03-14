import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PlanForm from './pages/PlanForm';
import PlanDetail from './pages/PlanDetail';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plans/new" element={<PlanForm />} />
          <Route path="/plans/:id/edit" element={<PlanForm />} />
          <Route path="/plans/:id" element={<PlanDetail />} />
        </Routes>
      </main>
    </div>
  );
}
