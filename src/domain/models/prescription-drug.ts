export interface PrescriptionDrug {
  id: string;
  eventId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  createdAt: string;
}

export interface CreatePrescriptionDrugInput {
  eventId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
}
