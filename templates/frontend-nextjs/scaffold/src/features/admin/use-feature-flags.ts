import { useQuery } from '@tanstack/react-query';
import { fetchFeatureFlags } from './feature-flag-service';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
  });
}
