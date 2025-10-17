import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface ReportListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: number;
}

const ReportListingDialog = ({ open, onOpenChange, listingId }: ReportListingDialogProps) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Report Submitted",
      description: "Thank you for your report. We'll review it shortly.",
    });
    onOpenChange(false);
    setReason('');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Listing</DialogTitle>
          <DialogDescription>
            Help us maintain quality by reporting issues with this listing
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Reason for Report</Label>
            <RadioGroup value={reason} onValueChange={setReason} required>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fraud" id="fraud" />
                <Label htmlFor="fraud" className="font-normal cursor-pointer">
                  Fraudulent or scam listing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inaccurate" id="inaccurate" />
                <Label htmlFor="inaccurate" className="font-normal cursor-pointer">
                  Inaccurate information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate" className="font-normal cursor-pointer">
                  Inappropriate content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stolen" id="stolen" />
                <Label htmlFor="stolen" className="font-normal cursor-pointer">
                  Suspected stolen vehicle
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Other
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional information..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!reason}>Submit Report</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportListingDialog;
