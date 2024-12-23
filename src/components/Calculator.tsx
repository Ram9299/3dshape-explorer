import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const calculateExpression = async () => {
    try {
      // For demo purposes, we'll evaluate locally
      // In production, this should be done server-side
      const result = eval(expression);
      setResult(result.toString());
      toast.success('Calculation completed!');
    } catch (error) {
      toast.error('Invalid expression');
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Calculator</h2>
      <div className="space-y-4">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter mathematical expression"
          className="bg-secondary"
        />
        <Button onClick={calculateExpression} className="w-full">
          Calculate
        </Button>
        {result && (
          <div className="p-2 bg-secondary rounded">
            Result: {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;