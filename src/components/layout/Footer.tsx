import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Trans<span className="text-primary">Fund</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Transparent fund tracking between NGOs and donors. See exactly where your money goes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/projects" className="hover:text-foreground transition-colors">
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup&role=ngo" className="hover:text-foreground transition-colors">
                  Register as NGO
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">
                  Become a Donor
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link to="/about#transparency" className="hover:text-foreground transition-colors">
                  Transparency
                </Link>
              </li>
              <li>
                <Link to="/about#security" className="hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TransFund. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with transparency in mind
          </p>
        </div>
      </div>
    </footer>
  );
}
