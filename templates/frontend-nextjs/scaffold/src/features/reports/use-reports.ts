import { useQuery } from '@tanstack/react-query';
import { fetchReports } from './report-service';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });
}
