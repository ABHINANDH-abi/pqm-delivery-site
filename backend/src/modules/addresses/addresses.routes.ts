import { Router } from 'express';
import { addressesController } from './addresses.controller';
import { validate } from '../../middleware/validate';
import { createAddressSchema, updateAddressSchema } from './addresses.validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All address routes require customer authentication
router.use(authenticate);

router.get('/', addressesController.getMyAddresses);
router.post('/', validate(createAddressSchema), addressesController.create);
router.patch('/:id', validate(updateAddressSchema), addressesController.update);
router.patch('/:id/default', addressesController.setDefault);
router.delete('/:id', addressesController.delete);

export default router;
