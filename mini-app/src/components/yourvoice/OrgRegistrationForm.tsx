import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, Image, FileText, ShieldCheck, MessageCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Spinner } from '@telegram-apps/telegram-ui';

type ScopeLevelType = 'countries' | 'region' | 'continent' | 'world' | 'city' | 'community'

export type OrgRegistrationSubmitData = {
  name: string
  purpose?: string
  scope_level: ScopeLevelType
  geographic_scope?: string
  logo_url?: string
  id_verification_required: boolean
  telegram_handle: string
}

interface OrgRegistrationFormProps {
  onSubmit?: (data: OrgRegistrationSubmitData) => Promise<void>;
}

export default function OrgRegistrationForm({ onSubmit }: OrgRegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    scopeLevel: 'countries' as ScopeLevelType,
    geographicScope: '',
    logo_url: '',
    idVerificationRequired: false,
    telegramHandle: ''
  });
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null)

    if (!formData.geographicScope) {
      console.error('Geographic scope is required');
      return;
    }

    setLoading(true)

    try {
      console.log('Org Registration:', formData);
      await onSubmit?.({
        name: formData.name,
        purpose: formData.purpose || undefined,
        scope_level: formData.scopeLevel,
        geographic_scope: formData.geographicScope,
        logo_url: formData.logo_url || undefined,
        id_verification_required: formData.idVerificationRequired,
        telegram_handle: formData.telegramHandle
      });
    }
    catch(e) {
      const error = e as Error
      setError(error.message)
    }
    finally{
      setLoading(false)
    }
  };

  // Check if only South Africa is selected
  const isSouthAfricaOnly = formData.scopeLevel === 'countries' &&
    formData.geographicScope.trim().toLowerCase() === 'south africa';

  return (
    <form data-testid="org-registration-form" onSubmit={handleSubmit} className="flex flex-col gap-10 bg-white rounded-md p-5">
      <div className='flex flex-col gap-2'>
        <h2 className="text-2xl text-foreground" > Register Organization</h2 >
        <p className="text-sm text-muted-foreground">
          Create your organization to start running polls
        </p>
      </div >

      <div className='flex flex-col gap-2'>
        <Label htmlFor="org-name" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Organization Name
        </Label>
        <Input
          id="org-name"
          type="text"
          placeholder="Save the Rhino International"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-org-name"
        />
      </div>

      <div className='flex flex-col gap-3'>
        <Label htmlFor="org-purpose" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Organization Purpose
        </Label>
        <Textarea
          id="org-purpose"
          placeholder="Describe what your organization does..."
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          rows={3}
          data-testid="input-org-purpose"
        />
        <p className="text-xs text-muted-foreground">
          Help voters understand your organization's mission and goals
        </p>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor="scope-level" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Geographic Scope Level
        </Label>
        <Select
          value={formData.scopeLevel}
          onValueChange={(value: string) => setFormData({
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

        {formData.scopeLevel === 'countries' && (
          <div className="space-y-4">
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
                Comma-separated list of countries where you operate
              </p>
            </div>

            {isSouthAfricaOnly && (
              <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="id-verification"
                    checked={formData.idVerificationRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, idVerificationRequired: checked === true })
                    }
                    data-testid="checkbox-id-verification"
                  />
                  <div className="space-y-1 flex-1">
                    <Label
                      htmlFor="id-verification"
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Require SA ID Verification
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.idVerificationRequired
                        ? "Voters MUST verify their South African ID number before voting. This ensures authentic demographic data."
                        : "ID verification is optional. Voters can self-attest their demographics or verify with SA ID."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              onValueChange={(value: any) => setFormData({ ...formData, geographicScope: value })}
              required
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
            {!formData.geographicScope && (
              <p className="text-xs text-destructive">Please select a continent</p>
            )}
          </div>
        )}

        {formData.scopeLevel === 'world' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This organization will operate worldwide
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
              Enter the city or town where your organization operates
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
              Enter the specific community or neighborhood where your organization operates
            </p>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor="logo-url" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Logo URL
        </Label>
        <Input
          id="logo-url"
          type="url"
          placeholder="https://example.com/logo.png"
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          data-testid="input-logo-url"
        />
        {formData.logo_url && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <img
              src={formData.logo_url}
              alt="Logo preview"
              className="w-20 h-20 rounded-lg border-2 border-border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor="telegram-handle" className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Telegram Handle (Optional)
        </Label>
        <Input
          id="telegram-handle"
          type="text"
          placeholder="@yourhandle"
          value={formData.telegramHandle}
          onChange={(e) => setFormData({ ...formData, telegramHandle: e.target.value })}
          data-testid="input-telegram-handle"
        />
        <p className="text-xs text-muted-foreground">
          Enter your Telegram handle to receive BTC donations via Brio
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" data-testid="button-register-org">
        Register Organization { loading && <Spinner size="s"/> }
      </Button>
      { error &&
          <p className="text-red-500 text-sm italic mt-2">{error}</p>
      }
    </form>
  );
}
