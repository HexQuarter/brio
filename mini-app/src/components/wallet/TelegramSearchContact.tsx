import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
import { LuX } from "react-icons/lu"
import { useTranslation } from "react-i18next"

type Props = {
    open: boolean
    handleOpen: (opened: boolean) => void
    handleSelection: (contact: string) => void
    search: string | undefined
    contacts: string[]
    handleShareInvite: () => void
    lookupError: string | null,
    placeholder: string
    removeContact: (contact: string) => void,
    contact: string | undefined
}

export const SearchContactForm: React.FC<Props> = ({ 
    open, 
    handleOpen, 
    search, 
    contact,
    contacts, 
    handleSelection, 
    handleShareInvite, 
    lookupError, 
    placeholder, 
    removeContact
}) => {
    const { t } = useTranslation();

    const normalizeSearch = (search: string) => search ? search.replace(/\s+/g, '') : ''
    const normalizedSearch = normalizeSearch(search || '')
    const normalizedContacts = contacts.map(contact => normalizeSearch(contact))
    return (
        <Popover open={open} onOpenChange={handleOpen}>
            <PopoverTrigger className="flex">
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="font-light h-0 border-gray-300 justify-between w-full"
                >
                    {search || placeholder}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <Command shouldFilter={false}>
                    <CommandInput placeholder={placeholder}  className="h-9" onValueChange={(e: string) => handleSelection(normalizeSearch(e))}/>
                    <CommandList>
                        { !search || !contact && 
                            <CommandEmpty>
                                { lookupError && 
                                    <>
                                        <p className="text-red-500 text-sm italic mt-2">{lookupError}</p>
                                        <Button variant="link" className="p-0 text-black text-sm italic" onClick={() => handleShareInvite()}>
                                            Share an invitation
                                        </Button>
                                    </>
                                }
                            </CommandEmpty>
                        }
                        { search && contact && 
                            <CommandGroup heading='Search Result'>
                                <div className={'flex justify-between h-10'}>
                                    <CommandItem
                                        value={contact}
                                        onSelect={(currentValue: string) => {
                                            handleSelection(normalizeSearch(currentValue) === normalizedSearch ? normalizedSearch : normalizeSearch(currentValue))
                                            handleOpen(false)
                                        }} 
                                        className="flex w-full">
                                        {contact}
                                    </CommandItem>
                                </div>
                            </CommandGroup>
                        }
                        { normalizedContacts.length > 0 && 
                            <CommandGroup heading={t('wallet.favourites')}>
                                {normalizedContacts.map((contact: string) => (
                                    <div className={'flex justify-between h-10'} key={contact}>
                                        <CommandItem
                                            value={contact}
                                            onSelect={(currentValue: string) => {
                                                handleSelection(normalizeSearch(currentValue) === normalizedSearch ? normalizedSearch : normalizeSearch(currentValue))
                                                handleOpen(false)
                                            }} className="flex w-full">
                                            {contact}
                                        </CommandItem>
                                        <Button variant="ghost" className="text-xs active:bg-primary active:text-white" onClick={() => removeContact(contact)}>
                                            <LuX />
                                        </Button>
                                    </div>
                                ))}
                            </CommandGroup>
                        }
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}