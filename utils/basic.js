import { ObjectId } from 'mongodb';

const basicUtils = {

  isIdValid(id) {
    if (typeof id !== 'string') return false;
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
