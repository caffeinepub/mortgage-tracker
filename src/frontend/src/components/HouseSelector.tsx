import { House } from '../backend';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Home } from 'lucide-react';

interface HouseSelectorProps {
  houses: House[];
  selectedHouseId: string | null;
  onSelectHouse: (houseId: string) => void;
}

export default function HouseSelector({ houses, selectedHouseId, onSelectHouse }: HouseSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Home className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Select House:</span>
      </div>
      <Select value={selectedHouseId || undefined} onValueChange={onSelectHouse}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a house" />
        </SelectTrigger>
        <SelectContent>
          {houses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
