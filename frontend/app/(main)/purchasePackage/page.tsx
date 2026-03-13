'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Result, Steps, message } from 'antd';

import {
  getBranches,
  getPackages,
  getPtAccounts,
  purchasePackage,
} from '@/app/services/api';
import type { FILTER_PACKAGE_PROPS, FILTER_PROPS } from '@/app/types/filters';
import type {
  Branch,
  Package,
  PtAccount,
  PurchasePackageRequest,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';
import SelectPackageStep from '@/app/components/purchase/SelectPackageStep';
import SelectBranchStep from '@/app/components/purchase/SelectBranchStep';
import SelectPtStep from '@/app/components/purchase/SelectPtStep';
import ConfirmPurchaseStep from '@/app/components/purchase/ConfirmPurchaseStep';

export default function PurchasePackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoggedIn, loading: authLoading } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedPtId, setSelectedPtId] = useState<string | null>(null);

  const [packageFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 50,
    unit: undefined,
  });
  const [branchFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 50,
    search: undefined,
  });
  const [ptFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 50,
    search: undefined,
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      message.warning('Vui lòng đăng nhập trước khi đăng ký gói tập.');
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const { data: packagesRes, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['packages', packageFilters],
    queryFn: () => getPackages(packageFilters),
    enabled: isLoggedIn,
  });

  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches', branchFilters],
    queryFn: () => getBranches(branchFilters),
    enabled: isLoggedIn,
  });

  const { data: ptsRes, isLoading: isLoadingPts } = useQuery({
    queryKey: ['pt-accounts', ptFilters],
    queryFn: () => getPtAccounts(ptFilters),
    enabled: isLoggedIn,
  });

  const packages: Package[] = packagesRes?.data ?? [];
  const branches: Branch[] = branchesRes?.data ?? [];
  const pts: PtAccount[] = ptsRes?.data ?? [];

  useEffect(() => {
    const initialPackageId = searchParams.get('packageId');
    if (!initialPackageId || selectedPackageId) return;
    const exists = packages.some((pkg) => pkg.id === initialPackageId);
    if (exists) {
      setSelectedPackageId(initialPackageId);
    }
  }, [packages, searchParams, selectedPackageId]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const selectedPt = useMemo(
    () => pts.find((pt) => pt.id === selectedPtId) ?? null,
    [pts, selectedPtId],
  );

  const requirePt = selectedPackage?.hasPt ?? false;

  const steps = useMemo(() => {
    const base = ['Gói tập', 'Cơ sở'];
    if (requirePt) base.push('Huấn luyện viên');
    base.push('Xác nhận');
    return base;
  }, [requirePt]);

  const isConfirmStep =
    (requirePt && currentStep === 3) || (!requirePt && currentStep === 2);

  const canProceed = () => {
    if (currentStep === 0) return !!selectedPackageId;
    if (currentStep === 1) return !!selectedBranchId;
    if (requirePt && currentStep === 2) return !!selectedPtId;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      message.warning('Vui lòng chọn đầy đủ thông tin trước khi tiếp tục.');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push('/packages');
    }
  };

  const { mutate: doPurchase, isPending: isPurchasing } = useMutation({
    mutationFn: (body: PurchasePackageRequest) => purchasePackage(body),
    onSuccess: () => {
      message.success('Đăng ký gói tập thành công!');
      router.push('/packages');
    },
    onError: () => {
      message.error('Đăng ký gói tập thất bại, vui lòng thử lại.');
    },
  });

  const handleConfirm = () => {
    if (!selectedPackageId || !selectedBranchId) {
      message.error('Thiếu thông tin gói tập hoặc cơ sở.');
      return;
    }
    if (requirePt && !selectedPtId) {
      message.error('Vui lòng chọn huấn luyện viên.');
      return;
    }

    const payload: PurchasePackageRequest = {
      packageId: selectedPackageId,
      branchId: selectedBranchId,
      ptAccountId: requirePt ? (selectedPtId ?? undefined) : undefined,
    };

    doPurchase(payload);
  };

  if (!isLoggedIn && !authLoading) {
    return (
      <Result
        status="warning"
        title="Vui lòng đăng nhập để đăng ký gói tập"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Về trang chủ
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 pt-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
            Đăng ký gói tập
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Hoàn thành các bước bên dưới để đăng ký gói tập tại PowerFit.
          </p>
        </div>

        <Steps
          current={currentStep}
          items={steps.map((title) => ({ title }))}
        />

        <div className="mt-4">
          {currentStep === 0 && (
            <SelectPackageStep
              loading={isLoadingPackages}
              packages={packages}
              selectedPackageId={selectedPackageId}
              onSelect={(pkg) => {
                setSelectedPackageId(pkg.id);
                if (!pkg.hasPt) {
                  setSelectedPtId(null);
                }
              }}
            />
          )}

          {currentStep === 1 && (
            <SelectBranchStep
              loading={isLoadingBranches}
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelect={(branch) => setSelectedBranchId(branch.id)}
            />
          )}

          {requirePt && currentStep === 2 && (
            <SelectPtStep
              loading={isLoadingPts}
              pts={pts}
              selectedPtId={selectedPtId}
              onSelect={(pt) => setSelectedPtId(pt.id)}
            />
          )}

          {isConfirmStep && (
            <ConfirmPurchaseStep
              selectedPackage={selectedPackage}
              selectedBranch={selectedBranch}
              selectedPt={selectedPt}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/90 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4">
            <Button onClick={handleBack}>Quay lại</Button>
            {isConfirmStep ? (
              <Button
                type="primary"
                onClick={handleConfirm}
                loading={isPurchasing}
              >
                Hoàn tất đăng ký
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Tiếp tục
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
