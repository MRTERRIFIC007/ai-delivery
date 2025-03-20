import React from "react";
import TimeSlotPrediction from "../components/TimeSlotPrediction";
import { Header } from "../components/Header";

const CreateOrderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
            <div className="grid grid-cols-1 gap-6">
              <TimeSlotPrediction />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateOrderPage;
