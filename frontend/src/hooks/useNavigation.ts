import { useNavigate, useLocation, useParams } from 'react-router-dom';

export interface NavigationHook {
  navigate: (path: string) => void;
  goBack: () => void;
  currentRoute: string;
  params: Record<string, string | undefined>;
}

export const useNavigation = (): NavigationHook => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const goBack = () => {
    navigate(-1);
  };

  return {
    navigate: handleNavigate,
    goBack,
    currentRoute: location.pathname,
    params,
  };
};