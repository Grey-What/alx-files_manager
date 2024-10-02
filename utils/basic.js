import { ObjectId } from 'mongodb';


const basicUtils = {

  isIdValid(id) {
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
