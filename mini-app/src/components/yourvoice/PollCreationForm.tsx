import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Calendar, Globe } from 'lucide-react';

interface PollCreationFormProps {
  orgCountries?: string;
  onSubmit?: (data: {
    question: string;
    scope_level: 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community';
    geographic_scope: string;
    start_at: number;
    end_at: number;
  }) => void;
}

export default function PollCreationForm({ orgCountries, onSubmit }: PollCreationFormProps) {
  const [formData, setFormData] = useState({
    question: '',
    scopeLevel: orgCountries ? 'countries' as const : 'countries' as 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
    geographicScope: orgCountries || '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      question: formData.question,
      scope_level: formData.scopeLevel,
      geographic_scope: formData.geographicScope,
      start_at: Math.floor(new Date(formData.startDate).getTime() / 1000),
      end_at:Math.floor(new Date(formData.endDate).getTime() / 1000),
    });
  };

  return (
    <div className="p-6 bg-gray-50 border-gray-200 border-1 rounded-md" data-testid="poll-creation-form">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl text-foreground">Create New Poll</h2>
          <p className="text-sm text-muted-foreground">
            Set up a Yes/No question for your community
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Poll Question
          </Label>
          <Textarea
            id="question"
            placeholder="Should we implement a 4-day work week?"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="min-h-32 resize-none text-base"
            required
            data-testid="input-question"
          />
        </div>

        {!orgCountries && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scope-level" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Geographic Scope Level
              </Label>
              <Select
                value={formData.scopeLevel}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  scopeLevel: value as 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community',
                  geographicScope: value === 'world' ? 'World' : ''
                })}
              >
                <SelectTrigger data-testid="select-scope-level">
                  <SelectValue placeholder="Select scope level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="countries">Countries</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                  <SelectItem value="continent">Continent</SelectItem>
                  <SelectItem value="world">World</SelectItem>
                  <SelectItem value="city">City/Town</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scopeLevel === 'countries' && (
              <div className="space-y-2">
                <Label htmlFor="geographic-scope">Countries</Label>
                <Input
                  id="geographic-scope"
                  type="text"
                  placeholder="South Africa, Kenya, Tanzania"
                  value={formData.geographicScope}
                  onChange={(e) => setFormData({ ...formData, geographicScope: e.target.value })}
                  required
                  data-testid="input-geographic-scope"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list (for SA ID verification, use "South Africa" only)
                </p>
              </div>
            )}

            {formData.scopeLevel === 'region' && (
              <div className="space-y-2">
                <Label htmlFor="geographic-scope">Region Name</Label>
                <Input
                  id="geographic-scope"
                  type="text"
                  placeholder="e.g., Southern Africa, East Africa"
                  value={formData.geographicScope}
                  onChange={(e) => setFormData({ ...formData, geographicScope: e.target.value })}
                  required
                  data-testid="input-geographic-scope"
                />
              </div>
            )}

            {formData.scopeLevel === 'continent' && (
              <div className="space-y-2">
                <Label htmlFor="geographic-scope">Continent</Label>
                <Select
                  value={formData.geographicScope}
                  onValueChange={(value) => setFormData({ ...formData, geographicScope: value })}
                >
                  <SelectTrigger data-testid="select-continent">
                    <SelectValue placeholder="Select continent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa">Africa</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="South America">South America</SelectItem>
                    <SelectItem value="Oceania">Oceania</SelectItem>
                    <SelectItem value="Antarctica">Antarctica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.scopeLevel === 'world' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This poll will be available worldwide
                </p>
              </div>
            )}

            {formData.scopeLevel === 'city' && (
              <div className="space-y-2">
                <Label htmlFor="geographic-scope">City/Town Name</Label>
                <Input
                  id="geographic-scope"
                  type="text"
                  placeholder="e.g., Cape Town, Durban, Johannesburg"
                  value={formData.geographicScope}
                  onChange={(e) => setFormData({ ...formData, geographicScope: e.target.value })}
                  required
                  data-testid="input-geographic-scope"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the city or town where this poll applies
                </p>
              </div>
            )}

            {formData.scopeLevel === 'community' && (
              <div className="space-y-2">
                <Label htmlFor="geographic-scope">Community Name</Label>
                <Input
                  id="geographic-scope"
                  type="text"
                  placeholder="e.g., Soweto, Alexandra Township, District Six"
                  value={formData.geographicScope}
                  onChange={(e) => setFormData({ ...formData, geographicScope: e.target.value })}
                  required
                  data-testid="input-geographic-scope"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the specific community or neighborhood where this poll applies
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              data-testid="input-start-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date
            </Label>
            <Input
              id="end-date"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              data-testid="input-end-date"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" data-testid="button-create-poll">
          Create Poll
        </Button>
      </form>
    </div>
  );
}
