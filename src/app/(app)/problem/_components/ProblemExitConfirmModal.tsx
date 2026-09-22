'use client';

import CloseIcon from '@/assets/icons/common/close.svg';
import { Button } from '@/components/common/Button';
import BaseModal from '@/components/common/Modal';

type ProblemExitConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSave: () => void;
  isPending?: boolean;
};

export default function ProblemExitConfirmModal({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSave,
  isPending = false,
}: ProblemExitConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onClose();
      }}
      hasOverlay
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-exit-confirm-title"
        className="bg-bg-white h-[376px] w-[540px] rounded-[12px] border border-gray-400 shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
      >
        <header className="flex justify-end pt-[20px] pb-[10px]">
          <button
            type="button"
            aria-label="닫기"
            className="mr-[25px] p-[7px] text-gray-700"
            onClick={onClose}
            disabled={isPending}
          >
            <CloseIcon className="h-[16px] w-[16px]" aria-hidden="true" focusable="false" />
          </button>
        </header>

        <div className="flex flex-col items-center px-[32px] pt-[20px]">
          <div className="bg-secondary-100 text-secondary-600 flex h-[80px] w-[80px] items-center justify-center rounded-full text-[48px] leading-none font-bold">
            ?
          </div>

          <h2
            id="problem-exit-confirm-title"
            className="mt-[20px] text-[24px] leading-[24px] font-bold tracking-normal text-gray-950"
          >
            진행도를 저장하고 나가시겠어요?
          </h2>

          <p className="mt-[20px] text-[16px] leading-[24px] font-medium tracking-normal text-gray-600">
            * 강제 종료하시면 진행도가 저장되지 않으니 주의하세요!
          </p>

          <div className="mt-[32px] flex items-center gap-[12px]">
            <Button
              size={54}
              width={133}
              className="leading-[30px] tracking-normal"
              onClick={onSaveAndExit}
              disabled={isPending}
            >
              {isPending ? '저장 중' : '저장하고 나가기'}
            </Button>

            <Button
              variant="gray"
              size={54}
              width={165}
              className="leading-[30px] tracking-normal"
              onClick={onExitWithoutSave}
              disabled={isPending}
            >
              저장하지 않고 나가기
            </Button>
          </div>
        </div>
      </section>
    </BaseModal>
  );
}
