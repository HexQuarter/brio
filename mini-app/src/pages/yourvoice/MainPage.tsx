import { FaPoll } from "react-icons/fa";
import { Outlet } from "react-router-dom";
import { MdAddChart } from "react-icons/md";
import { MdDomainAdd } from "react-icons/md";
import { MdHistory } from "react-icons/md";
import { Menu } from "@/components/Menu";

export function YourVoiceMainPage() {
  const menuItems = [
    {
      path: '/app/yourvoice/create-org',
      name: 'Create org',
      icon: MdDomainAdd,
    },
    {
      path: '/app/yourvoice/create-poll',
      name: 'Create poll',
      icon: MdAddChart
    },
    {
      path: '/app/yourvoice/active-polls',
      name: 'Active polls',
      icon: FaPoll
    },
    {
      path: '/app/yourvoice/past-polls',
      name: 'Past polls',
      icon: MdHistory
    }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 p-1 rounded-xl flex-1 flex flex-col mb-5">
          <div className="flex flex-col gap-10 mt-5 p-2">
              <Menu items={menuItems} buttonSize={22} />
              <Outlet />
          </div>
      </div>
    </div>
  );
}
