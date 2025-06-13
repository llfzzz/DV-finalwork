import { showMessage as customShowMessage } from '@/app/components/ui/Message';

export const showMessage = {
  success: (content: string) => {
    if (typeof window !== 'undefined') {
      console.log('✅ Success:', content);
      customShowMessage.success(content);
    }
  },
  error: (content: string) => {
    if (typeof window !== 'undefined') {
      console.error('❌ Error:', content);
      customShowMessage.error(content);
    }
  },
  warning: (content: string) => {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Warning:', content);
      customShowMessage.warning(content);
    }
  },
  info: (content: string) => {
    if (typeof window !== 'undefined') {
      console.info('ℹ️ Info:', content);
      customShowMessage.info(content);
    }
  }
};
