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
    removeContact: (contact: string) => void
}

export const SearchContactForm: React.FC<Props> = ({ 
    open, 
    handleOpen, 
    search, 
    contacts, 
    handleSelection, 
    handleShareInvite, 
    lookupError, 
    placeholder, 
    removeContact
}) => {
    const { t } = useTranslation();

    return (
        <Popover open={open} onOpenChange={handleOpen}>
            <PopoverTrigger className="flex">
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="font-light"
                >
                    {search ? contacts.find((contact) => contact === search) : placeholder}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="">
            <Command>
                <CommandInput placeholder={placeholder}  className="h-9" onValueChange={handleSelection}/>
                <CommandList>
                    <CommandEmpty>{ lookupError && 
                        <>
                            <p className="text-red-500 text-sm italic mt-2">{lookupError}</p>
                            <Button variant="link" className="p-0 text-black text-sm italic" onClick={() => handleShareInvite()}>Share an invitation</Button>
                        </>
                    }</CommandEmpty>
                    { contacts.length > 0 && 
                        <CommandGroup heading={t('wallet.favourites')}>
                            {contacts.map((contact) => (
                                <div className={'flex justify-between h-10'} key={contact}>
                                    <CommandItem
                                        value={contact}
                                        onSelect={(currentValue) => {
                                            handleSelection(currentValue === search ? search : currentValue)
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