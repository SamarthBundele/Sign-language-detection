
import { HandMetal } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-md">
            <HandMetal size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SignVision</h1>
            <p className="text-xs text-gray-500">Sign Language Detection</p>
          </div>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary">
                About
              </a>
            </li>
            <li>
              <a href="#" className="text-sm font-medium text-primary">
                Detection
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
