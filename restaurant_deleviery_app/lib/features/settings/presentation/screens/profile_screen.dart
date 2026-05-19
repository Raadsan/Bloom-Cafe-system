import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/controllers/auth_controller.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/screens/login_screen.dart';
import '../../../../core/theme/colors.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      body: Consumer<AuthController>(
        builder: (context, auth, child) {
          final user = auth.user;
          
          return SingleChildScrollView(
            child: Column(
              children: [
                _buildHeader(context, user),
                Padding(
                  padding: const EdgeInsets.all(25),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle("General"),
                      const SizedBox(height: 15),
                      _buildMenuItem(IconlyLight.user, "Personal Info", () => _showUpdateDialog(context, auth)),
                      _buildMenuItem(IconlyLight.heart, "Wishlist", () {}),
                      _buildMenuItem(IconlyLight.star, "Bonus Points", () {}, trailing: "1,250 pts"),
                      const SizedBox(height: 25),
                      _buildSectionTitle("Support"),
                      const SizedBox(height: 15),
                      _buildMenuItem(IconlyLight.info_square, "Help Center", () {}),
                      _buildMenuItem(IconlyLight.setting, "Settings", () {}),
                      const SizedBox(height: 40),
                      _buildLogoutBtn(context, auth),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Map<String, dynamic>? user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 60, bottom: 30, left: 25, right: 25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(35)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.green, width: 2),
                ),
                child: const CircleAvatar(
                  radius: 50,
                  backgroundColor: Color(0xFFF1F8F1),
                  child: Icon(IconlyBold.profile, size: 50, color: Colors.green),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            user?['fullName'] ?? "Guest User",
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          Text(
            user?['email'] ?? "Sign in to access all features",
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap, {String? trailing}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.grey[50], shape: BoxShape.circle),
              child: Icon(icon, color: Colors.grey[700], size: 20),
            ),
            const SizedBox(width: 15),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
            const Spacer(),
            if (trailing != null)
              Text(trailing, style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
            const Icon(IconlyLight.arrow_right_2, size: 18, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutBtn(BuildContext context, AuthController auth) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: OutlinedButton.icon(
        onPressed: () {
          auth.logout();
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        },
        icon: const Icon(IconlyLight.logout, color: Colors.red),
        label: const Text("Log Out", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.red),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      ),
    );
  }

  void _showUpdateDialog(BuildContext context, AuthController auth) {
    final nameController = TextEditingController(text: auth.user?['fullName']);
    final phoneController = TextEditingController(text: auth.user?['phone']);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          left: 25, right: 25, top: 25,
          bottom: MediaQuery.of(context).viewInsets.bottom + 25,
        ),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(35))),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Update Profile", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 25),
            _buildField("Full Name", nameController),
            const SizedBox(height: 15),
            _buildField("Phone", phoneController),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: () async {
                  await auth.updateProfile({
                    'fullName': nameController.text,
                    'phone': phoneController.text,
                  });
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                child: const Text("Save Changes", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.grey[50],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
      ),
    );
  }
}
