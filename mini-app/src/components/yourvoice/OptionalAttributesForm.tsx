import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { validateSAId } from '@/lib/yourvoice/utils';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface OptionalAttributesFormProps {
  countries?: string[];
  idVerificationRequired?: boolean;
  onAttributesChange?: (attributes: {
    age_bracket?: string;
    gender?: string;
    residence?: string;
    verification_method?: string;
  }) => void;
}

export default function OptionalAttributesForm({ countries = ['South Africa'], idVerificationRequired = false, onAttributesChange }: OptionalAttributesFormProps) {
  const isSouthAfricaOnly = countries.length === 1 && countries[0].toLowerCase().includes('south africa');
  const [useSaId, setUseSaId] = useState(idVerificationRequired);
  const [saId, setSaId] = useState('');
  const [saIdValid, setSaIdValid] = useState<boolean | null>(null);
  const [extractedData, setExtractedData] = useState<{
    ageBracket?: string;
    gender?: string;
  }>({});
  const [selfAttestation, setSelfAttestation] = useState({
    ageBracket: undefined,
    gender: undefined,
    residence: undefined,
  });

  // Sync useSaId with idVerificationRequired when it changes
  useEffect(() => {
    if (idVerificationRequired) {
      setUseSaId(true);
    }
  }, [idVerificationRequired]);

  const handleSaIdChange = (value: string) => {
    setSaId(value);
    const result = validateSAId(value);
    setSaIdValid(result.id_valid);

    if (result.id_valid) {
      setExtractedData({
        ageBracket: result.age_bucket,
        gender: result.gender,
      });
      if (selfAttestation.residence) {
        onAttributesChange?.({
          age_bracket: result.age_bucket,
          gender: result.gender,
          residence: selfAttestation.residence,
          verification_method: 'sa_id',
        });
      }
    } else {
      setExtractedData({});
    }
  };

  const handleSelfAttestationChange = (field: string, value: string) => {
    const updated = { ...selfAttestation, [field]: value };
    setSelfAttestation(updated);
    
    if (useSaId && saIdValid && extractedData.ageBracket && extractedData.gender) {
      onAttributesChange?.({
        age_bracket: extractedData.ageBracket,
        gender: extractedData.gender,
        residence: field === 'residence' ? value : updated.residence,
        verification_method: 'sa_id',
      });
    } else {
      onAttributesChange?.({
        age_bracket: updated.ageBracket,
        gender: updated.gender,
        residence: updated.residence,
        verification_method: 'self_attest',
      });
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gray-50 border-gray-200 border-1 rounded-md" data-testid="optional-attributes-form">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {idVerificationRequired ? 'Required ID Verification' : 'Optional Verification & Information'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {idVerificationRequired 
            ? 'This organization requires SA ID verification to vote. Your ID validates your age and gender automatically.'
            : 'Help us understand our community better. This information is aggregated only - no personal data is stored.'
          }
        </p>
      </div>

      {isSouthAfricaOnly && !idVerificationRequired && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-sa-id"
            checked={useSaId}
            onCheckedChange={(checked) => setUseSaId(checked as boolean)}
            data-testid="checkbox-use-sa-id"
          />
          <Label htmlFor="use-sa-id" className="text-sm font-medium cursor-pointer">
            Verify with SA ID (optional - auto-fills age & gender)
          </Label>
        </div>
      )}

      {useSaId && isSouthAfricaOnly && (
        <div className="space-y-2">
          <Label htmlFor="sa-id">South African ID Number</Label>
          <div className="relative">
            <Input
              id="sa-id"
              type="text"
              placeholder="9001015800089"
              value={saId}
              onChange={(e) => handleSaIdChange(e.target.value)}
              maxLength={13}
              className="font-mono"
              data-testid="input-sa-id"
            />
            {saIdValid === true && (
              <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
            )}
            {saIdValid === false && saId.length > 0 && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
            )}
          </div>
          {saIdValid === true && (
            <div className="space-y-2">
              <p className="text-sm text-success flex items-center gap-1 font-medium" data-testid="text-sa-id-verified">
                <ShieldCheck className="w-4 h-4" />
                Verified valid ID
              </p>
              <div className="bg-success/10 border border-success/20 rounded-md p-3 space-y-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Age Bracket:</span> <span data-testid="text-extracted-age">{extractedData.ageBracket}</span>
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Gender:</span> <span data-testid="text-extracted-gender" className="capitalize">{extractedData.gender}</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please select your residence below to complete verification.
              </p>
            </div>
          )}
          {saIdValid === false && saId.length > 0 && (
            <p className="text-sm text-destructive flex items-center gap-1">
              Invalid SA ID number. Please enter a valid ID or use self-attestation below.
            </p>
          )}
        </div>
      )}

      {!idVerificationRequired && (!useSaId || (useSaId && saIdValid !== true)) && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Age Bracket</Label>
            <RadioGroup
              value={selfAttestation.ageBracket}
              onValueChange={(value) => handleSelfAttestationChange('ageBracket', value)}
              data-testid="radio-age-bracket"
            >
              <div className="grid grid-cols-2 gap-2">
                {['<18', '18-24', '25-34', '35-44', '45-54', '55+'].map((bracket) => (
                  <div key={bracket} className="flex items-center space-x-2">
                    <RadioGroupItem value={bracket} id={`age-${bracket}`} />
                    <Label htmlFor={`age-${bracket}`} className="cursor-pointer font-normal">
                      {bracket}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              value={selfAttestation.gender}
              onValueChange={(value) => handleSelfAttestationChange('gender', value)}
              data-testid="radio-gender"
            >
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <RadioGroupItem value={gender.toLowerCase()} id={`gender-${gender}`} />
                    <Label htmlFor={`gender-${gender}`} className="cursor-pointer font-normal">
                      {gender}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      { countries && countries.length > 0 && countries[0] != '' &&
        <div className="space-y-2">
          <Label>Residence</Label>
          <RadioGroup
            value={selfAttestation.residence}
            onValueChange={(value) => handleSelfAttestationChange('residence', value)}
            data-testid="radio-residence"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-country" id="res-in" />
                <Label htmlFor="res-in" className="cursor-pointer font-normal">
                  {countries.length === 1 
                    ? `Inside ${countries[0]}`
                    : countries.length > 1 
                      ? `Inside ${countries.join(', ')}`
                      : 'Inside home country/countries'
                  }
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outside" id="res-out" />
                <Label htmlFor="res-out" className="cursor-pointer font-normal">
                  {countries.length === 1
                    ? `Outside ${countries[0]}`
                    : countries.length > 1
                      ? `Outside ${countries.join(', ')}`
                      : 'Outside home country/countries'
                  }
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      }
    </Card>
  );
}
