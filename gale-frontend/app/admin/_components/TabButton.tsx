import { Button } from "@/_components/ui/button";

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ isActive, onClick, children }: TabButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={`relative flex-shrink-0 whitespace-nowrap rounded-t-md bg-transparent px-3 py-0 font-medium sm:px-4 ${
        isActive ? "" : "text-gray-500 hover:text-primary"
      }`}
    >
      {children}
    </Button>
  );
};

export default TabButton;
