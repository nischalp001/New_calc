export interface CalculationResult {
  id: string;
  type: 'math' | 'advanced';
  input: string;
  output: string;
  timestamp: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, image: string | null) => Promise<void>;
  isLoading: boolean;
}

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculationResult[];
}
