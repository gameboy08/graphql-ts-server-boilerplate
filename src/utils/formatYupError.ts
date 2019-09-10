import { ValidationError } from "yup";

export default function formatYupEoor(err: ValidationError) {
  let errors: Array<{ path: string; message: string }> = [];
  errors = err.inner.map(e => {
    return {
      path: e.path,
      message: e.message
    };
  });
  return errors;
}
