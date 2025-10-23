import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="relative"
    >
      <Sun 
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
        data-testid="icon-sun"
      />
      <Moon 
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
        data-testid="icon-moon"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
