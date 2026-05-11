import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import '../controllers/address_controller.dart';

class AddressSelectionSheet extends StatefulWidget {
  const AddressSelectionSheet({super.key});

  @override
  State<AddressSelectionSheet> createState() => _AddressSelectionSheetState();
}

class _AddressSelectionSheetState extends State<AddressSelectionSheet> {
  final _placeController = TextEditingController();
  final _districtController = TextEditingController();
  final _streetController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isDefault = false;
  bool _isAdding = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AddressController>().fetchAddresses(1); // Placeholder customerId
    });
  }

  @override
  void dispose() {
    _placeController.dispose();
    _districtController.dispose();
    _streetController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      padding: EdgeInsets.only(
        left: 25,
        right: 25,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 25,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(35)),
      ),
      child: SingleChildScrollView(
        child: Consumer<AddressController>(
          builder: (context, controller, child) {
            if (_isAdding || controller.addresses.isEmpty) {
              return _buildAddForm(controller);
            }
            return _buildAddressList(controller);
          },
        ),
      ),
    );
  }

  Widget _buildAddressList(AddressController controller) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHandle(),
        const SizedBox(height: 25),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "My Addresses",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: "Poppins"),
            ),
            TextButton.icon(
              onPressed: () => setState(() => _isAdding = true),
              icon: const Icon(Icons.add),
              label: const Text("Add New"),
            ),
          ],
        ),
        const SizedBox(height: 20),
        ...controller.addresses.map((addr) {
          final isSelected = controller.selectedAddress?['id'] == addr['id'];
          return GestureDetector(
            onTap: () {
              controller.selectAddress(addr);
              Navigator.pop(context);
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 15),
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: isSelected ? Colors.green.withOpacity(0.05) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? Colors.green : Colors.grey[200]!,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  const Icon(IconlyLight.location, color: Colors.green),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(addr['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(
                          "${addr['district']}, ${addr['street']}",
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  if (addr['isDefault'])
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text("Default", style: TextStyle(fontSize: 10, color: Colors.green)),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildAddForm(AddressController controller) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHandle(),
        const SizedBox(height: 25),
        Row(
          children: [
            if (controller.addresses.isNotEmpty)
              IconButton(
                onPressed: () => setState(() => _isAdding = false),
                icon: const Icon(Icons.arrow_back),
              ),
            const Text(
              "Add New Address",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: "Poppins"),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildField("Place Name", "Home, Office", IconlyLight.location, _placeController),
        const SizedBox(height: 15),
        _buildField("District", "Hodan, Waberi", IconlyLight.discovery, _districtController),
        const SizedBox(height: 15),
        _buildField("Street", "Maka Al-Mukarama", IconlyLight.activity, _streetController),
        const SizedBox(height: 15),
        _buildField("Phone", "061XXXXXXX", IconlyLight.call, _phoneController, isPhone: true),
        const SizedBox(height: 15),
        SwitchListTile(
          title: const Text("Set as default address", style: TextStyle(fontSize: 14)),
          value: _isDefault,
          activeColor: Colors.green,
          onChanged: (val) => setState(() => _isDefault = val),
        ),
        const SizedBox(height: 25),
        SizedBox(
          width: double.infinity,
          height: 55,
          child: ElevatedButton(
            onPressed: () async {
              if (_placeController.text.isEmpty || _districtController.text.isEmpty) return;
              
              final success = await controller.addAddress({
                'customerId': 1,
                'name': _placeController.text,
                'district': _districtController.text,
                'street': _streetController.text,
                'phone': _phoneController.text,
                'isDefault': _isDefault,
              });

              if (success && mounted) {
                if (controller.addresses.length == 1) Navigator.pop(context);
                setState(() => _isAdding = false);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            child: controller.isLoading 
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text("Save & Continue", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildHandle() {
    return Center(
      child: Container(
        width: 50, height: 5,
        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _buildField(String label, String hint, IconData icon, TextEditingController controller, {bool isPhone = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20, color: Colors.green),
            filled: true,
            fillColor: Colors.grey[50],
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}
