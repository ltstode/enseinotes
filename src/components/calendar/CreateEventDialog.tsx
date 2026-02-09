import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { CustomEventType } from '@/types/enseinotes';
import { format } from 'date-fns';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

const eventTypeLabels: Record<CustomEventType, string> = {
  reunion: 'Réunion',
  conseil: 'Conseil de classe',
  formation: 'Formation',
  sortie: 'Sortie scolaire',
  autre: 'Autre',
};

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ open, onOpenChange, defaultDate }) => {
  const { addCustomEvent } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CustomEventType>('reunion');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (open && defaultDate) {
      setDate(format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [open, defaultDate]);

  const handleSubmit = () => {
    if (!title.trim() || !date) return;

    addCustomEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      eventType,
    });

    setTitle('');
    setDescription('');
    setEventType('reunion');
    setDate('');
    setEndDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="event-title">Titre</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Conseil de classe 3ème A"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-type">Type d'événement</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as CustomEventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-date">Date de fin (opt.)</Label>
              <Input
                id="event-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-desc">Description (optionnel)</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes ou détails…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !date}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
