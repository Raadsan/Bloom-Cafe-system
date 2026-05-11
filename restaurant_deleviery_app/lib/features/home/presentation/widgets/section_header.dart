import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import '../../../../core/theme/colors.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;
  final bool showGridToggle;
  final bool isGrid;
  final VoidCallback? onGridToggle;

  const SectionHeader({
    super.key,
    required this.title,
    required this.onSeeAll,
    this.showGridToggle = false,
    this.isGrid = false,
    this.onGridToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontFamily: "Poppins",
              fontWeight: FontWeight.w500,
              color: Colors.grey,
            ),
          ),
          Row(
            children: [
              TextButton(
                onPressed: onSeeAll,
                child: Row(
                  children: [
                    Text(
                      "See all",
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 13,
                        fontFamily: "Poppins",
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      IconlyLight.arrow_right_2,
                      size: 16,
                      color: Colors.green[800],
                    ),
                  ],
                ),
              ),
              if (showGridToggle) ...[
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: onGridToggle,
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: isGrid ? AppColors.primaryColor : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isGrid
                            ? AppColors.primaryColor
                            : Colors.grey[300]!,
                      ),
                    ),
                    child: Icon(
                      isGrid ? Icons.list_rounded : Icons.grid_view_rounded,
                      size: 18,
                      color: isGrid ? Colors.white : Colors.grey[400],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
