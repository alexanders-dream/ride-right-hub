import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface FinancingCalculatorProps {
  price: number;
}

const FinancingCalculator = ({ price }: FinancingCalculatorProps) => {
  const [downPayment, setDownPayment] = useState(price * 0.2);
  const [loanTerm, setLoanTerm] = useState(60);
  const [interestRate, setInterestRate] = useState(7.5);

  const calculateMonthlyPayment = () => {
    const principal = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm;
    
    if (monthlyRate === 0) return principal / numPayments;
    
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return monthlyPayment;
  };

  const monthlyPayment = calculateMonthlyPayment();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Financing Calculator</h3>
      
      <div className="space-y-6">
        {/* Monthly Payment Display */}
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</div>
          <div className="text-3xl font-bold text-primary">
            ${monthlyPayment.toFixed(0)}<span className="text-base">/mo</span>
          </div>
        </div>

        {/* Down Payment */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Down Payment</Label>
            <span className="text-sm font-medium">${downPayment.toFixed(0)}</span>
          </div>
          <Slider
            value={[downPayment]}
            onValueChange={([value]) => setDownPayment(value)}
            max={price}
            step={1000}
            className="w-full"
          />
        </div>

        {/* Loan Term */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Loan Term</Label>
            <span className="text-sm font-medium">{loanTerm} months</span>
          </div>
          <Slider
            value={[loanTerm]}
            onValueChange={([value]) => setLoanTerm(value)}
            min={12}
            max={84}
            step={12}
            className="w-full"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <Label>Interest Rate (APR)</Label>
          <Input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
            step={0.1}
            min={0}
            max={30}
            className="w-full"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          * This calculator provides estimates only. Actual rates and terms may vary.
        </div>
      </div>
    </Card>
  );
};

export default FinancingCalculator;
