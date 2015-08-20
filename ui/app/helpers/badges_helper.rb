module BadgesHelper

  def badge_data_message(badge)
    badge.badge_type.to_description(badge)
  end

end
